import { Component, OnInit, NgZone } from "@angular/core";
import { PeerService, BroadcastInfo } from "../services/peer.service";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { FormControl, FormGroup, NgForm, FormBuilder } from "@angular/forms";

@Component({
  selector: "app-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.css"],
})
export class ChatComponent implements OnInit {
  messageForm: FormGroup;
  messageToSend: FormControl; 
  myPeerId: string;
  messages: any[] = [];
  roomName: string;
  showEmojiPicker: boolean = false;

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
    this.messageToSend = new FormControl("");
    this.messageForm = this.formBuilder.group({
      messageToSend: this.messageToSend,
    });
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(event) {
    console.log(event);
    this.messageToSend.patchValue(this.messageToSend.value + event.emoji.native);
  }

  subscribeToPeerServerEvents() {
    // In peer.service.ts use meessageReceived.emit(<data here>) to catch here
    this.peerService.infoBroadcasted.subscribe((message: any) => {
      this.ngZone.run(() => {
        if (message === BroadcastInfo.UpdateAllMessages) {
          this.messages = this.peerService.getAllMessages();
          setTimeout(() => window.scrollTo(0, 1000000), 10); // Wait 10 milli sec for message to be updated
        } else if (message === BroadcastInfo.RoomName) {
          this.roomName = this.peerService.getRoomName();
          this.location.replaceState("/chat/" + this.roomName);
        }
      });
    });
  }

  sendMessage(form: NgForm) {
    console.log("Me: " + this.messageToSend.value);
    this.peerService.sendMessage(this.messageToSend.value);
    this.messages = this.peerService.getAllMessages();
    this.messageForm.setValue({ messageToSend: "" });
    setTimeout(() => window.scrollTo(0, 1000000), 10); // Wait 10 milli sec for message to be updated
    this.showEmojiPicker = false;
  }
}
