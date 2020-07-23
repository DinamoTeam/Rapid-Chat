export class Message {
  content: any;
  messageType: MessageType;
  fromPeerId: string;
  toPeerId: string;

  constructor(
    content: any,
    messageType: MessageType,
    fromPeerId: string,
    toPeerId: string
  ) {
    this.content = content;
    this.messageType = messageType;
    this.fromPeerId = fromPeerId;
    this.toPeerId = toPeerId;

  }
}

export const enum MessageType {
  Message = 0,
  ImageFile = 1,
  AllMessages = 2,
  RequestAllMessages = 3,
}
