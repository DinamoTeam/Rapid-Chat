import { Component, OnInit, NgZone } from "@angular/core";
import { PeerService } from "../services/peer.service";
import { ActivatedRoute } from "@angular/router";
import { Location } from '@angular/common';

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit {
  peerConnectToId: any; // binded with html input
  messageToSend: string; // binded with html text area
  myPeerId: string;
  messages: any[] = [];
  roomName: string;

  constructor(
    private peerService: PeerService,
    private ngZone: NgZone,
    private actRoute: ActivatedRoute,
    private location: Location
  ) {
    this.peerService.connectionEstablished.subscribe((successful: boolean) => {
      if (successful) {
        this.myPeerId = this.peerService.getPeerId();
        this.roomName = this.actRoute.snapshot.params["roomName"];
        if (this.roomName == "NONE") {
          this.peerService.createNewRoom();
        } else {
          this.peerService.joinExistingRoom(this.roomName);
        }
      }
    });
  }

  ngOnInit() {
    this.subscribeToPeerServerEvents();
  }

  subscribeToPeerServerEvents() {
    // In peer.service.ts use meessageReceived.emit(<data here>) to catch here
    this.peerService.messageReceived.subscribe((message: any) => {
      this.ngZone.run(() => {
        if (message === "UPDATE MESSAGES") {
          this.messages = this.peerService.getAllMessages();
        } else if (message == "RoomName") {
          this.roomName = this.peerService.getRoomName();
          this.location.replaceState('/' + this.roomName);
        }
      });
    });
  }

  sendMessage() {
    console.log("Me: " + this.messageToSend);
    this.peerService.sendMessage(this.messageToSend);
    this.messages = this.peerService.getAllMessages();
  }

  getAllPeerIds() {
    console.log("All peers I am connected to: ");
    console.log(this.peerService.getAllPeerIds());
  }

  getPreviousMessages() {
    console.log("Previous messages: ");
    console.log(this.peerService.getAllMessages());
  }
}
