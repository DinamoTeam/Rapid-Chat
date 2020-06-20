export class Message {
  messages: string[];
  messageType: MessageType;
  fromPeerId: string;
  toPeerId: string;
  time: number;
  constructor(
    messages: string[],
    messageType: MessageType,
    fromPeerId: string,
    toPeerId: string,
    time: number
  ) {
    this.messages = messages;
    this.messageType = messageType;
    this.fromPeerId = fromPeerId;
    this.toPeerId = toPeerId;
    this.time = time;
  }
}

export const enum MessageType {
  Message = 0,
  AllMessages = 1,
  RequestAllMessages = 2,
  Acknowledge = 3,
}
