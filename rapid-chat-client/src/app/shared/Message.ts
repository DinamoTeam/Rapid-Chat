export class Message {
  messages: string[];
  messageType: MessageType;
  constructor(messages: string[], messageType: MessageType) {
    this.messages = messages;
    this.messageType = messageType;
  }
}

export const enum MessageType {
  PeerId = 0,
  Message = 1,
}
