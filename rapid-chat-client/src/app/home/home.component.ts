import { Component, OnInit, NgZone } from "@angular/core";
import { PeerService, BroadcastInfo } from "../services/peer.service";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { FormControl, FormGroup, NgForm, FormBuilder } from '@angular/forms';

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit {
  peerConnectToId: any; // binded with html input
  messageForm: FormGroup;
  messageToSend: FormControl; // binded with html text area
  myPeerId: string;
  messages: any[] = [];
  roomName: string;

  constructor(
    private peerService: PeerService,
    private ngZone: NgZone,
    private actRoute: ActivatedRoute,
    private location: Location,
    private formBuilder: FormBuilder
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
    this.messageToSend = new FormControl('');
    this.messageForm = this.formBuilder.group({
      'messageToSend': this.messageToSend
    });
  }

  subscribeToPeerServerEvents() {
    // In peer.service.ts use meessageReceived.emit(<data here>) to catch here
    this.peerService.infoBroadcasted.subscribe((message: any) => {
      this.ngZone.run(() => {
        if (message === BroadcastInfo.UpdateAllMessages) {
          this.messages = this.peerService.getAllMessages();
        } else if (message == BroadcastInfo.RoomName) {
          this.roomName = this.peerService.getRoomName();
          this.location.replaceState("/" + this.roomName);
        }
      });
    });
  }

  sendMessage(form: NgForm) {
    console.log("Me: " + this.messageToSend.value);
    this.peerService.sendMessage(this.messageToSend.value);
    this.messages = this.peerService.getAllMessages();
    this.messageForm.setValue({ 'messageToSend': ''});
    window.scrollTo(0, document.body.scrollHeight + 2000);
  }

  getAllPeerIds() {
    console.log("All peers I am connected to: ");
    console.log(this.peerService.getAllPeerIds());
  }

  getPreviousMessages() {
    console.log("Previous messages: ");
    console.log(this.peerService.getAllMessages());
  }

  getMessagesToBeAck() {
    console.log("Messages to be ack: ");
    console.log(this.peerService.getMessagesToBeAck());
  }
}
