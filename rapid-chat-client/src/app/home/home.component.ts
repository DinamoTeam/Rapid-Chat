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
  constructor() {

  }

  ngOnInit() {
    this.peer = new Peer(); // Create a new peer and connect to peerServer. We can get our id from this.peer.id

    // When a connection between peerServer and this peer is first established
    this.peer.on('open', ourId => {
      console.log('We just connect to peerServer. Our id: ' + ourId);
      this.allPeerIdsInRoom.push(ourId);
    });

    // Listen to another peer connecting to us
    this.peer.on('connection', conn => {
        // When a peer connect to us, a connection is create and we need to listen to data from that connection
        console.log('A peer with connectionId: ' + conn.peer + ' just connected to me');
        this.broadcastNewPeerIdExcept(conn.peer, conn);
        this.addConnectionToListUniquely([conn], this.connectionsIAmHolding);
        this.addPeerIdsToListUniquely([conn.peer], this.allPeerIdsInRoom);
        this.setupListenerForConnection(conn);
      });

    this.peer.on('disconnected', () => {
      setTimeout(() => this.peer.reconnect(), 3000);
    });
  }

  setupListenerForConnection(conn: any) {
    conn.on('open', otherPeerId => this.sendAllPeerIdsInRoomForNewUser(conn));  // When the connection first establish
    conn.on('data', message => this.handleMessageFromPeer(message, conn)); // the other peer send us some data
    conn.on('close', () => this.handleConnectionClose()); // either us or the other peer close the connection
  }

  connect() {
    const conn = this.peer.connect(this.peerConnectToId, {reliable: true});
    this.addConnectionToListUniquely([conn], this.connectionsIAmHolding);
    this.addPeerIdsToListUniquely([conn.peer], this.allPeerIdsInRoom);
    console.log('I just connected to peer with id: ' + this.peerConnectToId);
    this.setupListenerForConnection(conn);
  }

  sendMessage() {
    console.log('Me: ' + this.message);
    const messageToSent = new Message([this.message], MessageType.Message, this.peer.id);
    const messageInJson = JSON.stringify(messageToSent);
    this.connectionsIAmHolding.forEach(conn => conn.send(messageInJson));
  }

  handleMessageFromPeer(messageJson: string, fromConn) {
    let message: Message = null;
    message = JSON.parse(messageJson);
    if (message.messageType === MessageType.PeerId) {
      const peerIds = message.messages;
      this.addPeerIdsToListUniquely(peerIds, this.allPeerIdsInRoom);
      this.broadcastPeerIdExcept(messageJson, fromConn);
    } else if (message.messageType === MessageType.Message) {
      const messageContent = message.messages[0];
      console.log(message.peerId + ': ' + messageContent);
      this.broadcastMessageExcept(messageJson, fromConn);
    } else {
      throw new Error('Unhandled message type');
    }
  }

  handleConnectionClose() {
    console.log('A connection is closed');
  }

  sendAllPeerIdsInRoomForNewUser(conn) {
    const message = new Message(this.allPeerIdsInRoom, MessageType.PeerId, this.peer.id);
    conn.send(JSON.stringify(message));
  }

  broadcastMessageExcept(messageJson: string, exceptConn) {
    this.connectionsIAmHolding.forEach(connection => {
      if (connection.peer !== exceptConn.peer) {
        connection.send(messageJson);
      }
    });
  }

  broadcastNewPeerIdExcept(newPeerId, exceptConn) {
    const peerId = new Message([newPeerId], MessageType.PeerId, this.peer.id);
    this.connectionsIAmHolding.forEach(connection => {
      if (connection !== exceptConn) {
        connection.send(JSON.stringify(peerId));
      }
    });
  }

  broadcastPeerIdExcept(peerIdJson, exceptConn) {
    this.connectionsIAmHolding.forEach(connection => {
      if (connection !== exceptConn) {
        connection.send(peerIdJson);
      }
    });
  }

  addPeerIdsToListUniquely(peerIdsToAdd: string[], listToAdd: string[]) {
    peerIdsToAdd.forEach(id => {
      if (listToAdd.indexOf(id) === -1) {
        listToAdd.push(id);
      }
    });
  }

  addConnectionToListUniquely(conn: any[], listToAdd: any[]) {
    conn.forEach(connection => {
      if (listToAdd.indexOf(connection) === -1) {
        listToAdd.push(connection);
      }
    })
  }

  getAllPeerIds() {
    console.log('All peers in room except myself: ');
    console.log(this.allPeerIdsInRoom);
  }

  getAllPeerIdsIAmConnectedTo() {
    console.log('All peers I am connected to: ');
    console.log(this.connectionsIAmHolding.map(conn => conn.peer));
  }
}
