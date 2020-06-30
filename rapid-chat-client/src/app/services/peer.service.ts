import { EventEmitter, Injectable } from "@angular/core";
import { Message, MessageType } from "../shared/Message";
import { RoomService } from "./room.service";
import { Router } from '@angular/router';

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
  private peerIdsInRoom: any[] = [];
  private connectionsIAmHolding: any[] = [];
  private previousMessages: Message[] = [];
  private messagesToBeAcknowledged: Message[] = [];
  private hasReceivedAllMessages = false;
  connectionEstablished = new EventEmitter<Boolean>();
  infoBroadcasted = new EventEmitter<any>();

  constructor(
    private roomService: RoomService,
    private router: Router
) {
    // Create a new peer and connect to peerServer. We can get our id from this.peer.id
    // this.peer = new Peer({ host: "https://dinamopeerserver.azurewebsites.net/", port: 443, secure: true });
    //this.peer = new Peer({ host: "localhost", port: 80});
    this.peer = new Peer();
    this.connectToPeerServer();
    this.registerConnectToMeEvent();
    this.reconnectToPeerServer();
  }

  //************* Connect + Reconnect to PeerServer *************
  private connectToPeerServer() {
    this.peer.on(PeerEvent.Open, (myId: string) => {
      console.log("I have connected to peerServer. My id: " + myId);
      this.connectionEstablished.emit(true);
    });
  }

  private reconnectToPeerServer() {
    this.peer.on(PeerEvent.Disconnected, () => {
      // Disconnect => destroy permanently this peer. Need to test this more!
      this.peer.destroy();
      // Also, refresh browser or sth like that
    });
  }
  //*************************************************************

  private registerConnectToMeEvent() {
    this.peer.on(PeerEvent.Connection, (conn: any) => {
      console.log(
        "A peer with connectionId: " + conn.peer + " have just connected to me"
      );
      this.setupListenerForConnection(conn);
    });
  }

  private connectToPeer(otherPeerId: any, getOldMessages: boolean) {
    const conn = this.peer.connect(otherPeerId, { reliable: true, serialization: 'json' });
    this.addUnique([conn], this.connectionsIAmHolding);

    if (getOldMessages === true) {
      this.connToGetOldMessages = conn;
    }
    console.log("I just connected to peer with id: " + otherPeerId);
    this.setupListenerForConnection(conn);
  }

  private connectToTheRestInRoom(exceptPeerId: any) {
    this.peerIdsInRoom.forEach((peerId) => {
      if (peerId !== exceptPeerId) {
        this.connectToPeer(peerId, false);
      }
    });
  }

  private setupListenerForConnection(conn: any) {
    this.addUnique([conn], this.connectionsIAmHolding);
    conn.on(ConnectionEvent.Open, () => {
      // If we chose this peer to give us all messages
      if (this.connToGetOldMessages === conn) {
        this.requestOldMessages(conn);
      }
    }); // When the connection first establish
    conn.on(ConnectionEvent.Data, (message) =>
      this.handleMessageFromPeer(message, conn)
    ); // the other peer send us some data
    conn.on(ConnectionEvent.Close, () => this.handleConnectionClose(conn)); // either us or the other peer close the connection
  }

  private handleMessageFromPeer(messageJson: string, fromConn: any) {
    const message: Message = JSON.parse(messageJson);
    switch (message.messageType) {
      case MessageType.Message:
        this.addUniqueMessages([message], this.previousMessages);
        this.infoBroadcasted.emit(BroadcastInfo.UpdateAllMessages);
        // Send Acknowledgement
        fromConn.send(
          JSON.stringify(
            new Message(null, MessageType.Acknowledge, null, null, message.time)
          )
        );
        break;
      case MessageType.AllMessages:
        this.hasReceivedAllMessages = true;
        const messages: Message[] = JSON.parse(message.content);
        this.addUniqueMessages(messages, this.previousMessages);
        this.infoBroadcasted.emit(BroadcastInfo.UpdateAllMessages);
        // Send Acknowledgement
        fromConn.send(
          JSON.stringify(
            new Message(null, MessageType.Acknowledge, null, null, message.time)
          )
        );
        this.connectToTheRestInRoom(fromConn.peer);
        break;
      case MessageType.RequestAllMessages:
        console.log("RequestAllMessages from " + fromConn.peer);
        if (!this.hasReceivedAllMessages) {
          console.log("I haven't received allMessages yet. Can't send to that peer");
        } else {
          this.sendOldMessages(fromConn);
        }
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
      this.hasReceivedAllMessages = true;
    } else {
      this.peerIdsInRoom = peerIds;
      // this.connectToPeer(peerIds[0], true);
      const randIndex = Math.floor(Math.random() * peerIds.length);
      this.connectToPeer(peerIds[randIndex], true);
      const that = this;
      setTimeout(function () {
        if (!that.hasReceivedAllMessages) {
          // The peer we intended to get old messages from just left the room or is taking to long to answer
          alert('The peer we intended to get old messages from just left the room or is taking to long to answer. Reloading');
          window.location.reload(true);
        }
      }, 4000);
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

  private addUniqueMessages(list: Message[], listToBeAddedTo: Message[]) {
    list.forEach((message) => {
      let weHadThatMessage = false;
      for (let i = 0; i < listToBeAddedTo.length; i++) {
        if (
          listToBeAddedTo[i].fromPeerId === message.fromPeerId &&
          listToBeAddedTo[i].time === message.time
        ) {
          weHadThatMessage = true;
          break;
        }
      }
      if (!weHadThatMessage) {
        listToBeAddedTo.push(message);
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
        if (peerIds.length === 1 && peerIds[0] === "ROOM_NOT_EXIST") {
          // Either room not exists or has been deleted
          this.router.navigate(['/']);
          alert('Room not exists, navigating back to home');
        }
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
      new Message(content, MessageType.Message, this.peer.id, null, this.time)
    );

    this.connectionsIAmHolding.forEach((conn) => {
      const messageToSend = new Message(
        content,
        MessageType.Message,
        this.peer.id,
        conn.peer,
        this.time
      );
      const messageInJson = JSON.stringify(messageToSend);
      conn.send(messageInJson);
      this.messagesToBeAcknowledged.push(messageToSend);
      const that = this; // setTimeOut will not know what 'this' is => Store 'this' in a variable
      setTimeout(function () {
        that.acknowledgeOrResend(messageToSend);
      }, that.timeWaitForAck);
    });
    this.time++;
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
        console.error(
          "Please tell Minh if you see this! PeerServer should have deleted this user from Db???"
        );
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

export const enum PeerEvent {
  Open = "open",
  Close = "close",
  Connection = "connection",
  Data = "data",
  Disconnected = "disconnected",
  Error = "error",
}

export const enum ConnectionEvent {
  Open = "open",
  Close = "close",
  Data = "data",
  Error = "error",
}

export const enum BroadcastInfo {
  UpdateAllMessages = 0,
  RoomName = 1,
}
