export class Message {
  content: any;
  messageType: MessageType;
  fromPeerId: string;
  toPeerId: string;
  time: number;
  constructor(
    content: any,
    messageType: MessageType,
    fromPeerId: string,
    toPeerId: string,
    time: number
  ) {
    this.content = content;
    this.messageType = messageType;
    this.fromPeerId = fromPeerId;
    this.toPeerId = toPeerId;
    this.time = time;
  }

  toString(): string {
    return "Time: " + this.time;
  }
}

export const enum MessageType {
  Message = 0,
  ImageFile = 1,
  AllMessages = 2,
  RequestAllMessages = 3,
}
