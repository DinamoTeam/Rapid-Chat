import { Component, OnInit, NgZone } from '@angular/core';
import { PeerService } from '../services/peer.service';

declare const Peer: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  peerConnectToId: any; // binded with html input
  messageToSend: string; // binded with html text area
  myPeerId: string;
  messages: any[] = []

  constructor(private peerService: PeerService, private ngZone: NgZone) {
    this.peerService.connectionEstablished.subscribe(
      (successful: boolean) => {
        if (successful) {
          this.myPeerId = this.peerService.getPeerId();
        }
      }
    );
  }

  ngOnInit() {
    this.subscribeToPeerServerEvents();
  }

  subscribeToPeerServerEvents() {
    // In peer.service.ts use meessageReceived.emit(<data here>) to catch here
    this.peerService.messageReceived.subscribe((message: any) => {
      this.ngZone.run(() => {
        if (message === "NEW MESS") {
          this.messages = this.peerService.previousMessages;
        }
      });
    });
  }

  connect() {
    this.peerService.connectToPeer(this.peerConnectToId);
  }

  sendMessage() {
    console.log('Me: ' + this.messageToSend);
    this.peerService.sendMessage(this.messageToSend);
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
