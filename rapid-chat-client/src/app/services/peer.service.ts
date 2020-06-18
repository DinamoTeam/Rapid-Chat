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
  connectionEstablished = new EventEmitter<Boolean>();
  private connectionsIAmHolding: any[] = [];
  messageReceived = new EventEmitter<any>();
  private previousMessages: Message[] = [];

  constructor(private roomService: RoomService) {
    this.peer = new Peer(); // Create a new peer and connect to peerServer. We can get our id from this.peer.id
    this.connectToPeerServer();
    this.registerConnectToMeEvent();
    this.reconnectToPeerServer();
  }

  private connectToPeerServer() {
    this.peer.on("open", (myId) => {
      console.log("I have connected to peerServer. My id: " + myId);
      this.connectionEstablished.emit(true);
    });
  }

  private registerConnectToMeEvent() {
    this.peer.on("connection", (conn) => {
      console.log(
        "A peer with connectionId: " + conn.peer + " have just connected to me"
      );
      this.setupListenerForConnection(conn);
    });
  }

  private reconnectToPeerServer() {
    this.peer.on("disconnected", () => {
      setTimeout(() => this.peer.reconnect(), 3000);
    });
  }

  connectToPeer(otherPeerId: any, getOldMessages: boolean) {
    const conn = this.peer.connect(otherPeerId, { reliable: true });
    this.addUnique([conn], this.connectionsIAmHolding);
    if (getOldMessages === true) {
      this.connToGetOldMessages = conn;
    }
    console.log("I just connected to peer with id: " + otherPeerId);
    this.setupListenerForConnection(conn);
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

  private setupListenerForConnection(conn: any) {
    conn.on("open", (otherPeerId) => this.handlePeerConnectionFirstOpen(conn)); // When the connection first establish
    conn.on("data", (message) => this.handleMessageFromPeer(message, conn)); // the other peer send us some data
    conn.on("close", () => this.handleConnectionClose(conn)); // either us or the other peer close the connection
  }

  private handlePeerConnectionFirstOpen(conn: any) {
    this.addUnique([conn], this.connectionsIAmHolding);
    // If we chose this peer to give us all messages
    if (this.connToGetOldMessages === conn) {
      this.requestOldMessages(conn);
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
    conn.send(JSON.stringify(message));
  }

  private handleMessageFromPeer(messageJson: string, fromConn: any) {
    const message: Message = JSON.parse(messageJson);

    switch (message.messageType) {
      case MessageType.Message:
        const messageContent: string = message.messages[0];
        console.log(message.peerId + ": " + messageContent);
        this.previousMessages.push(message);
        this.messageReceived.emit("UPDATE MESSAGES");
        break;
      case MessageType.AllMessages:
        const messages: Message[] = JSON.parse(message.messages[0]);
        this.previousMessages = this.previousMessages.concat(messages);
        console.log("Old messages: ");
        messages.forEach((mes) => {
          console.log(mes.peerId + ": " + mes.messages[0]);
        });
        this.messageReceived.emit("UPDATE MESSAGES");
        break;
      case MessageType.RequestAllMessages:
        this.sendOldMessages(fromConn);
        break;
      default:
        throw new Error("Unhandled message type");
    }
  }

  private handleConnectionClose(conn) {
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

  private addUnique(list: any[], listToBeAddedTo: any[]) {
    list.forEach((obj) => {
      if (listToBeAddedTo.indexOf(obj) === -1) {
        // Note: '==', NOT '==='
        listToBeAddedTo.push(obj);
      }
    });
  }

  getPeerId(): string {
    return this.peer.id;
  }

  getAllMessages(): any[] {
    return this.previousMessages;
  }

  getAllPeerIds() {
    console.log(this.connectionsIAmHolding.map((conn) => conn.peer));
  }

  handleFirstJoinRoom(peerIds: any[]) {
    if (peerIds.length === 0) {
      // DO NOTHING
      console.log("I am the first one in this room");
    } else {
      this.connectToPeer(peerIds[0], true);
      // Đáng nhẽ phải để this.peer nhận xong old messages từ peerIds[0] rồi mới connect với các peer còn lại
      // Cơ mà connect luôn for testing purposes
      for (let i = 1; i < peerIds.length; i++) {
        this.connectToPeer(peerIds[1], false);
      }
    }
  }

  createNewRoom() {
    this.roomService.getNewRoomName().subscribe((data: string) => {
      this.roomName = data;
    });

    // No peerId
    this.handleFirstJoinRoom([]);
  }

  joinExistingRoom(roomName: string) {
    // TODO

    // Get peerIds in room
    const peerIds: any[] = null;
    this.handleFirstJoinRoom(peerIds);
  }
}
