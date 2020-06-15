import { Component, OnInit } from '@angular/core';

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
  connectionsIAmConnectedTo: any[] = [];
  allPeerIdsInRoom: any[] = [];
  constructor() {

  }

  ngOnInit() {
    this.peer = new Peer(); // Create a new peer and connect to peerServer. We can get our id from this.peer.id

    // When a connection between peerServer and this peer is first established
    this.peer.on('open', ourId => console.log('We just connect to peerServer. Our id: ' + ourId));

    // Listen to another peer connecting to us
    this.peer.on('connection', conn => {
        // When a peer connect to us, a connection is create and we need to listen to data from that connection
        console.log('A peer with connectionId: ' + conn.peer + ' just connected to me');
        setTimeout(() => this.sendAllPeerIds(conn), 2000);
        this.allPeerIdsInRoom.push(conn.peer);
        this.setupListenerForConnection(conn);
      });

    this.peer.on('disconnected', () => {
      setTimeout(() => this.peer.reconnect(), 3000);
    });
  }

  setupListenerForConnection(conn: any) {
    conn.on('open', otherPeerId => this.sendAllPeerIds(conn));  // When the connection first establish
    conn.on('data', message => this.handleMessageFromPeer(message, conn)); // the other peer send us some data
    conn.on('close', () => this.handleConnectionClose()); // either us or the other peer close the connection
  }

  connect() {
    const conn = this.peer.connect(this.peerConnectToId, {reliable: true}); // peerConnectToId from html input
    console.log('I just connected to peer with id: ' + this.peerConnectToId);
    this.allPeerIdsInRoom.push(conn.peer);
    this.setupListenerForConnection(conn);
  }

  sendMessage() {
    // console.log('I am sending this message: ' + this.message + ' to all connections I have');
    console.log('Me: ' + this.message);
    this.connectionsIAmConnectedTo.forEach(conn => conn.send('1' + this.message)); // 0 is for connection id, 1 is for normal messages
  }

  sendAllPeerIds(conn: any) {
    // console.log('I am sending all peerIds I am connecting with!');
    let allPeerId = '';
    this.allPeerIdsInRoom.forEach(id => allPeerId += (id + '\n'));
    console.log('I am sending: ');
    console.log(allPeerId);
    conn.send('0' + allPeerId); // 0 is for connection id, 1 is for normal messages
    this.connectionsIAmConnectedTo.push(conn);
  }

  handleMessageFromPeer(message: string, fromConn) {
    // console.log('Message from peer: ' + message);
    if (message[0] === '0') { // PeerIds
      console.log('Received lots of ids: ' + message);
      const peerIds = message.substr(1, message.length).split('\n');
      this.allPeerIdsInRoom.concat(peerIds);
    } else { // normal message
      // console.log('Broadcasting this message to all peers I am connecting with');
      console.log('New message from ' + fromConn.peer + ': ' + message.substring(1, message.length));
      this.broadcastMessageExcept(message, fromConn);
    }
  }

  handleConnectionClose() {
    console.log('A connection is closed');
  }

  broadcastMessageExcept(message: string, exceptConn) {
    this.connectionsIAmConnectedTo.forEach(connection => {
      if (connection.peer !== exceptConn.peer) {
        connection.send(message);
      }
    });
  }

  getAllPeerIds() {
    console.log('All peers in room except myself: ');
    console.log(this.allPeerIdsInRoom);
  }

  getAllPeersIAmConnectedTo() {
    console.log('All peers I am connected to: ');
    console.log(this.connectionsIAmConnectedTo);
  }

}
