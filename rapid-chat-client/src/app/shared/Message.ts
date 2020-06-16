export class Message {
  messages: string[];
  messageType: MessageType;
  peerId: string;
  constructor(messages: string[], messageType: MessageType, peerId: string) {
    this.messages = messages;
    this.messageType = messageType;
    this.peerId = peerId;
  }
}

export const enum MessageType {
  PeerId = 0,
  Message = 1,
}
