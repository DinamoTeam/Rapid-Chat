import { EventEmitter, Injectable } from "@angular/core";
import { Message, MessageType } from "../shared/Message";
import { RoomService } from "./room.service";

declare const Peer: any;

@Injectable({
  providedIn: "root",
})
export class PeerService {
  private timeWaitForAck = 1000; // Millisecond
  private time = 0;
  private peer: any;
  private roomName: string;
  private connToGetOldMessages: any;
  private connectionsIAmHolding: any[] = [];
  private previousMessages: Message[] = [];
  private messagesToBeAcknowledged: Message[] = [];
  connectionEstablished = new EventEmitter<Boolean>();
  infoBroadcasted = new EventEmitter<any>();

  constructor(private roomService: RoomService) {
    // Create a new peer and connect to peerServer. We can get our id from this.peer.id
    this.peer = new Peer({ host: "localhost", port: 9000, path: "/myapp" });
    this.connectToPeerServer();
    this.registerConnectToMeEvent();
    this.reconnectToPeerServer();
  }

  //************* Connect + Reconnect to PeerServer *************
  private connectToPeerServer() {
    this.peer.on(PeerServer.Open, (myId: string) => {
      console.log("I have connected to peerServer. My id: " + myId);
      this.connectionEstablished.emit(true);
    });
  }

  private reconnectToPeerServer() {
    this.peer.on(PeerServer.Disconnected, () => {
      setTimeout(function () {
        this.peer.reconnect();
      }, 3000);
    });
  }
  //*************************************************************

  private registerConnectToMeEvent() {
    this.peer.on(PeerServer.Connection, (conn: any) => {
      console.log(
        "A peer with connectionId: " + conn.peer + " have just connected to me"
      );
      this.setupListenerForConnection(conn);
    });
  }

  private connectToPeer(otherPeerId: any, getOldMessages: boolean) {
    const conn = this.peer.connect(otherPeerId, { reliable: true });
    this.addUnique([conn], this.connectionsIAmHolding);

    if (getOldMessages === true) {
      this.connToGetOldMessages = conn;
    }
    console.log("I just connected to peer with id: " + otherPeerId);
    this.setupListenerForConnection(conn);
  }

  private setupListenerForConnection(conn: any) {
    this.addUnique([conn], this.connectionsIAmHolding);
    conn.on(PeerServer.Open, () => {
      // If we chose this peer to give us all messages
      if (this.connToGetOldMessages === conn) {
        this.requestOldMessages(conn);
      }
    }); // When the connection first establish
    conn.on(PeerServer.Data, (message) =>
      this.handleMessageFromPeer(message, conn)
    ); // the other peer send us some data
    conn.on(PeerServer.Close, () => this.handleConnectionClose(conn)); // either us or the other peer close the connection
  }

  private handleMessageFromPeer(messageJson: string, fromConn: any) {
    const message: Message = JSON.parse(messageJson);
    switch (message.messageType) {
      case MessageType.Message:
        if (!this.hasReceivedMessage(message)) {
          const messageContent: string = message.content;
          this.previousMessages.push(message);
          this.infoBroadcasted.emit(BroadcastInfo.UpdateAllMessages);
        }
        // Send Acknowledgement
        fromConn.send(
          JSON.stringify(
            new Message(null, MessageType.Acknowledge, null, null, message.time)
          )
        );
        break;
      case MessageType.AllMessages:
        const messages: Message[] = JSON.parse(message.content);
        if (messages.length !== 0 && !this.hasReceivedMessage(messages[0])) {
          this.previousMessages = this.previousMessages.concat(messages);
          console.log("Old messages: ");
          messages.forEach((mes) => {
            console.log(mes.fromPeerId + ": " + mes.content);
          });
          this.infoBroadcasted.emit(BroadcastInfo.UpdateAllMessages);
        }
        // Send Acknowledgement
        fromConn.send(
          JSON.stringify(
            new Message(null, MessageType.Acknowledge, null, null, message.time)
          )
        );
        break;
      case MessageType.RequestAllMessages:
        console.log("RequestAllMessages from " + fromConn.peer);
        this.sendOldMessages(fromConn);
        break;
      case MessageType.Acknowledge:
        const indexDelete = this.messagesToBeAcknowledged.findIndex(
          (mes) => mes.time === message.time
        );
        if (indexDelete !== -1) {
          this.messagesToBeAcknowledged.splice(indexDelete, 1);
        }
        break;
      default:
        throw new Error("Unhandled message type");
    }
  }

  private handleConnectionClose(conn: any) {
    console.log(
      "Connection to " +
        conn.peer +
        " is closed. It will be deleted in the connectionsIAmHolding list!"
    );
    const index = this.connectionsIAmHolding.findIndex(
      (connection) => connection === conn
    );
    this.connectionsIAmHolding.splice(index, 1);
  }

  //***************** Handle when join room *******************
  private handleFirstJoinRoom(peerIds: any[]) {
    if (peerIds.length === 0) {
      // DO NOTHING
      console.log("I am the first one in this room");
    } else {
      this.connectToPeer(peerIds[0], true);
      // Đáng nhẽ phải để this.peer nhận xong old messages từ peerIds[0] rồi mới connect với các peer còn lại
      // Cơ mà connect luôn for testing purposes
      for (let i = 1; i < peerIds.length; i++) {
        this.connectToPeer(peerIds[i], false);
      }
    }
  }

  private requestOldMessages(conn: any) {
    const message = new Message(
      null,
      MessageType.RequestAllMessages,
      null,
      null,
      this.time++
    );
    conn.send(JSON.stringify(message));
  }

  private sendOldMessages(conn: any) {
    const message = new Message(
      JSON.stringify(this.previousMessages),
      MessageType.AllMessages,
      this.peer.id,
      conn.peer,
      this.time++
    );
    console.log("Sending old messages: ");
    conn.send(JSON.stringify(message));
    this.messagesToBeAcknowledged.push(message);
    console.log(
      "Send old messages to " + conn.peer + " with time: " + message.time
    );
    const that = this; // setTimeOut will not know what 'this' is => Store 'this' in a variable
    setTimeout(function () {
      that.acknowledgeOrResend(message);
    }, that.timeWaitForAck);
  }
  //*************************************************************

  private addUnique(list: any[], listToBeAddedTo: any[]) {
    list.forEach((obj) => {
      if (listToBeAddedTo.indexOf(obj) === -1) {
        listToBeAddedTo.push(obj);
      }
    });
  }

  createNewRoom() {
    this.roomService.joinNewRoom(this.peer.id).subscribe((data: string) => {
      this.roomName = data;
      console.log("roomName: " + this.roomName);
      // No peerId
      this.handleFirstJoinRoom([]);
      this.infoBroadcasted.emit(BroadcastInfo.RoomName);
    });
  }

  joinExistingRoom(roomName: string) {
    this.roomName = roomName;
    this.roomService.joinExistingRoom(this.peer.id, this.roomName).subscribe(
      (peerIds) => {
        console.log(peerIds);
        this.handleFirstJoinRoom(peerIds.result);
      },
      (error) => {
        console.error(error);
      }
    );
  }

  sendMessage(content: string) {
    if (content.length === 0) {
      return;
    }

    this.previousMessages.push(
      new Message(content, MessageType.Message, this.peer.id, null, -1)
    );

    this.connectionsIAmHolding.forEach((conn) => {
      const messageToSend = new Message(
        content,
        MessageType.Message,
        this.peer.id,
        conn.peer,
        this.time++
      );
      const messageInJson = JSON.stringify(messageToSend);
      conn.send(messageInJson);
      this.messagesToBeAcknowledged.push(messageToSend);
      const that = this; // setTimeOut will not know what 'this' is => Store 'this' in a variable
      setTimeout(function () {
        that.acknowledgeOrResend(messageToSend);
      }, that.timeWaitForAck);
    });
  }

  acknowledgeOrResend(mess: Message, hasSent = 0) {
    // If message hasn't been received
    if (
      this.messagesToBeAcknowledged.find(
        (message) => message.time === mess.time
      )
    ) {
      const conn = this.connectionsIAmHolding.find(
        (connection) => connection.peer === mess.toPeerId
      );
      // Has sent for more than 5 times
      if (hasSent > 5) {
        console.log('PeerServer should have deleted this user from Db???');
        this.connectionsIAmHolding = this.connectionsIAmHolding.filter(
          (connection) => connection.peer !== conn.peer
        );
        return;
      }

      // If that peer hasn't disconnect
      if (conn) {
        conn.send(JSON.stringify(mess));
        console.log("Waiting too long for ack. Resent messages");
        const that = this; // setTimeOut will not know what 'this' is => Store 'this' in a variable
        setTimeout(function () {
          that.acknowledgeOrResend(mess, hasSent + 1);
        }, that.timeWaitForAck);
      }
    }
  }

  hasReceivedMessage(message: Message): boolean {
    return (
      this.previousMessages.find(
        (mes) =>
          mes.fromPeerId === message.fromPeerId && mes.time === message.time
      ) != null
    );
  }

  getPeerId(): string {
    return this.peer.id;
  }

  getRoomName(): string {
    return this.roomName;
  }

  getAllMessages(): any[] {
    return this.previousMessages;
  }

  getAllPeerIds(): string[] {
    return this.connectionsIAmHolding.map((conn) => conn.peer);
  }

  getMessagesToBeAck(): any[] {
    return this.messagesToBeAcknowledged;
  }
}

export const enum PeerServer {
  Open = "open",
  Close = "close",
  Connection = "connection",
  Data = "data",
  Disconnected = "disconnected",
}

export const enum BroadcastInfo {
  UpdateAllMessages = 0,
  RoomName = 1,
}
