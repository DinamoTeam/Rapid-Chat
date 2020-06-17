import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-message-bubble',
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.css']
})
export class MessageBubbleComponent implements OnInit {
  @Input() senderName: string;
  @Input() content: string

  constructor() { }

  ngOnInit() {
  }

}
