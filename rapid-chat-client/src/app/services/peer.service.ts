import { EventEmitter, Injectable } from "@angular/core";
import { Message, MessageType } from "../shared/Message";
import { RoomService } from "./room.service";

declare const Peer: any;

@Injectable({
  providedIn: "root",
})
export class PeerService {
  private peer: any;
  private roomName: string;
  private connToGetOldMessages: any;
  private connectionsIAmHolding: any[] = [];
  private previousMessages: Message[] = [];
  connectionEstablished = new EventEmitter<Boolean>();
  infoBroadcasted = new EventEmitter<any>();

  constructor(private roomService: RoomService) {
    this.peer = new Peer(); // Create a new peer and connect to peerServer. We can get our id from this.peer.id
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
      setTimeout(() => this.peer.reconnect(), 3000);
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
    conn.on(PeerServer.Open, () => {
      this.addUnique([conn], this.connectionsIAmHolding);
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
        const messageContent: string = message.messages[0];
        console.log(message.peerId + ": " + messageContent);
        this.previousMessages.push(message);
        this.infoBroadcasted.emit(BroadcastInfo.UpdateAllMessages);
        break;
      case MessageType.AllMessages:
        console.log("Received old messages!");
        const messages: Message[] = JSON.parse(message.messages[0]);
        this.previousMessages = this.previousMessages.concat(messages);
        console.log("Old messages: ");
        messages.forEach((mes) => {
          console.log(mes.peerId + ": " + mes.messages[0]);
        });
        this.infoBroadcasted.emit(BroadcastInfo.UpdateAllMessages);
        break;
      case MessageType.RequestAllMessages:
        console.log(fromConn.peer + " just asked me to give him all messages");
        this.sendOldMessages(fromConn);
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

    // TODO: Delete the peerId from Peer table in DB
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
    const message = new Message(null, MessageType.RequestAllMessages, null);
    conn.send(JSON.stringify(message));
  }

  private sendOldMessages(conn: any) {
    const message = new Message(
      [JSON.stringify(this.previousMessages)],
      MessageType.AllMessages,
      null
    );
    console.log("Sending old messages: ");
    console.log(JSON.stringify(message));
    conn.send(JSON.stringify(message));
  }
  //*************************************************************

  private addUnique(list: any[], listToBeAddedTo: any[]) {
    list.forEach((obj) => {
      if (listToBeAddedTo.indexOf(obj) === -1) {
        // Note: '==', NOT '==='
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

  sendMessage(mess: string) {
    if (mess.length === 0) {
      return;
    }
    const messageToSend = new Message(
      [mess],
      MessageType.Message,
      this.peer.id
    );
    const messageInJson = JSON.stringify(messageToSend);
    this.previousMessages.push(messageToSend);
    this.connectionsIAmHolding.forEach((conn) => conn.send(messageInJson));
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

  getAllPeerIds() {
    console.log(this.connectionsIAmHolding.map((conn) => conn.peer));
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
