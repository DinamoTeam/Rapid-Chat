import { EventEmitter, Injectable } from "@angular/core";
import { Message, MessageType } from "../shared/Message";

declare const Peer: any;

@Injectable({
  providedIn: "root",
})
export class PeerService {
  private peer: any;
  connectionEstablished = new EventEmitter<Boolean>();
  connectionsIAmHolding: any[] = [];
  allPeerIdsInRoom: any[] = [];
  messageReceived = new EventEmitter<any>();
  previousMessages: Message[] = [];

  constructor() {
    this.peer = new Peer(); // Create a new peer and connect to peerServer. We can get our id from this.peer.id
    this.connectToPeerServer();
    this.registerConnectToMeEvent();
    this.reconnectToPeerServer();
  }

  private connectToPeerServer() {
    this.peer.on("open", (myId) => {
      console.log("I have connected to peerServer. My id: " + myId);
      this.connectionEstablished.emit(true);
      this.allPeerIdsInRoom.push(myId);
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

  connectToPeer(otherPeerId: any) {
    const conn = this.peer.connect(otherPeerId, { reliable: true });
    console.log("I just connected to peer with id: " + otherPeerId);
    this.setupListenerForConnection(conn);
  }

  sendMessage(mess: string) {
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
    conn.on("close", () => this.handleConnectionClose()); // either us or the other peer close the connection
  }

  private handlePeerConnectionFirstOpen(conn: any) {
    this.addUnique([conn.peer], this.allPeerIdsInRoom);
    this.addUnique([conn], this.connectionsIAmHolding);

    if (this.isOldUser()) {
      this.sendAllPeerIdsInRoomToNewUser(conn);
      this.sendOldMessages(conn);
      const newPeerIdJson = JSON.stringify(
        new Message([conn.peer], MessageType.PeerId, null)
      );
      this.broadcastMessageExcept(newPeerIdJson, conn);
    }
  }

  private sendAllPeerIdsInRoomToNewUser(conn) {
    const message = new Message(
      this.allPeerIdsInRoom,
      MessageType.PeerId,
      this.peer.id
    );
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
    let message: Message = null;
    message = JSON.parse(messageJson);

    switch (message.messageType) {
      case MessageType.PeerId:
        const peerId = message.messages;
        this.addUnique(peerId, this.allPeerIdsInRoom);
        this.broadcastMessageExcept(messageJson, fromConn);
        break;
      case MessageType.AllPeerIds:
        const peerIds = message.messages;
        this.addUnique(peerIds, this.allPeerIdsInRoom);
        break;
      case MessageType.Message:
        const messageContent: string = message.messages[0];
        console.log(message.peerId + ": " + messageContent);
        this.previousMessages.push(message);
        this.broadcastMessageExcept(messageJson, fromConn);
        this.messageReceived.emit("UPDATE MESSAGES");
        break;
      case MessageType.AllMessages:
        const messages: Message[] = JSON.parse(message.messages[0]);
        this.previousMessages = this.previousMessages.concat(messages);
        console.log("Old messages: ");
        messages.forEach((mes) => {
          console.log(mes.peerId + ": " + mes.messages[0]);
        });
        this.broadcastMessageExcept(messageJson, fromConn);
        this.messageReceived.emit("UPDATE MESSAGES");
        break;
      default:
        throw new Error("Unhandled message type");
    }
  }

  private broadcastMessageExcept(messageJson: string, exceptConn: any) {
    this.connectionsIAmHolding.forEach((connection) => {
      if (connection.peer !== exceptConn.peer) {
        connection.send(messageJson);
      }
    });
  }

  private handleConnectionClose() {
    console.log("A connection is closed");
  }

  private isOldUser(): boolean {
    return this.allPeerIdsInRoom.length > 2 || this.previousMessages.length > 0;
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
}
