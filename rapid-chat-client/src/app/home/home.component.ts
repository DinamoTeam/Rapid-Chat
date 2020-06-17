import { Component, OnInit } from '@angular/core';
import { Message, MessageType } from '../shared/Message';
import { PeerService } from '../services/peer.service';

declare const Peer: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  peerConnectToId: any; // binded with html input
  message: string; // binded with html text area
  myPeerId: string;

  constructor(private peerService: PeerService) {
    this.peerService.connectionEstablished.subscribe(
      (successful: boolean) => {
        if (successful) {
          this.myPeerId = this.peerService.getPeerId();
        }
      }
    );
  }

  ngOnInit() {
    //this.subscribeToPeerServerEvents();
  }

  subscribeToPeerServerEvents() {
    // In peer.service.ts use meessageReceived.emit(<data here>) to catch here
  }

  connect() {
    this.peerService.connectToPeer(this.peerConnectToId);
  }

  sendMessage() {
    console.log('Me: ' + this.message);
    this.peerService.sendMessage(this.message);
  }

  getAllPeerIds() {
    console.log('All peers in room except myself: ');
    console.log(this.peerService.allPeerIdsInRoom);
  }

  getAllPeerIdsIAmConnectedTo() {
    console.log('All peers I am connected to: ');
    console.log(this.peerService.connectionsIAmHolding.map(conn => conn.peer));
  }

  getPreviousMessages() {
    console.log('Previous messages: ');
    console.log(this.peerService.previousMessages);
  }
}
