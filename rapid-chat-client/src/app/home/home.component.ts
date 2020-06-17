import { Component, OnInit } from '@angular/core';
import { Message, MessageType } from '../shared/Message';

declare const Peer: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  peer: any;
  peerConnectToId: any; // binded with html input
  message: string; // binded with html text area
  connectionsIAmHolding: any[] = [];
  allPeerIdsInRoom: any[] = [];
  previousMessages: Message[] = [];

  ngOnInit() {
    this.peer = new Peer(); // Create a new peer and connect to peerServer. We can get our id from this.peer.id

    // When a connection between peerServer and this peer is first established
    this.peer.on('open', ourId => {
      console.log('We just connect to peerServer. Our id: ' + ourId);
      this.allPeerIdsInRoom.push(ourId);
    });

    // Listen to another peer connecting to us
    this.peer.on('connection', conn => {
      console.log('A peer with connectionId: ' + conn.peer + ' just connected to me');
      // When a peer connect to us, a connection is create and we need to listen to data from that connection
      this.setupListenerForConnection(conn);
    });

    this.peer.on('disconnected', () => {
      setTimeout(() => this.peer.reconnect(), 3000);
    });
  }

  setupListenerForConnection(conn: any) {
    conn.on('open', otherPeerId => this.handlePeerConnectionFirstOpen(conn));  // When the connection first establish
    conn.on('data', message => this.handleMessageFromPeer(message, conn)); // the other peer send us some data
    conn.on('close', () => this.handleConnectionClose()); // either us or the other peer close the connection
  }

  connect() {
    const conn = this.peer.connect(this.peerConnectToId, {reliable: true});
    console.log('I just connected to peer with id: ' + this.peerConnectToId);
    this.setupListenerForConnection(conn);
  }

  sendMessage() {
    console.log('Me: ' + this.message);
    const messageToSend = new Message([this.message], MessageType.Message, this.peer.id);
    const messageInJson = JSON.stringify(messageToSend);
    this.previousMessages.push(messageToSend);
    this.connectionsIAmHolding.forEach(conn => conn.send(messageInJson));
  }

  handlePeerConnectionFirstOpen(conn) {
    this.addUnique([conn.peer], this.allPeerIdsInRoom);
    this.addUnique([conn], this.connectionsIAmHolding);

    if (this.isOldUser()) {
      this.sendAllPeerIdsInRoomToNewUser(conn);
      this.sendOldMessages(conn);
      const newPeerIdJson = JSON.stringify(new Message([conn.peer], MessageType.PeerId, null));
      this.broadcastMessageExcept(newPeerIdJson, conn);
    }
  }

  handleMessageFromPeer(messageJson: string, fromConn) {
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
        console.log(message.peerId + ': ' + messageContent);
        this.previousMessages.push(message);
        this.broadcastMessageExcept(messageJson, fromConn);
        break;
      case MessageType.AllMessages:
        const messages: Message[] = JSON.parse(message.messages[0]);
        this.previousMessages = this.previousMessages.concat(messages);
        console.log('Old messages: ');
        messages.forEach(mes => {
          console.log(mes.peerId + ': ' + mes.messages[0]);
        });
        this.broadcastMessageExcept(messageJson, fromConn);
        break;
      default:
        throw new Error('Unhandled message type');
    }
  }

  handleConnectionClose() {
    console.log('A connection is closed');
  }

  sendAllPeerIdsInRoomToNewUser(conn) {
    const message = new Message(this.allPeerIdsInRoom, MessageType.PeerId, this.peer.id);
    conn.send(JSON.stringify(message));
  }

  sendOldMessages(conn) {
    const message = new Message([JSON.stringify(this.previousMessages)], MessageType.AllMessages, null);
    conn.send(JSON.stringify(message));
  }

  broadcastMessageExcept(messageJson: string, exceptConn) {
    this.connectionsIAmHolding.forEach(connection => {
      if (connection.peer !== exceptConn.peer) {
        connection.send(messageJson);
      }
    });
  }

  addUnique(list: any[], listToBeAddedTo: any[]) {
    list.forEach(obj => {
      if (listToBeAddedTo.indexOf(obj) === -1) { // Note: '==', NOT '==='
        listToBeAddedTo.push(obj);
      }
    });
  }

  isOldUser(): boolean {
    return this.allPeerIdsInRoom.length > 2 || this.previousMessages.length > 0;
  }

  getAllPeerIds() {
    console.log('All peers in room except myself: ');
    console.log(this.allPeerIdsInRoom);
  }

  getAllPeerIdsIAmConnectedTo() {
    console.log('All peers I am connected to: ');
    console.log(this.connectionsIAmHolding.map(conn => conn.peer));
  }

  getPreviousMessages() {
    console.log('Previous messages: ');
    console.log(this.previousMessages);
  }
}
