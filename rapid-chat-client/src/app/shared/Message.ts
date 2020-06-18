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
  Message = 0,
  AllMessages = 1,
  RequestAllMessages = 2
}
