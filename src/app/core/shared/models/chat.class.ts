export class Chat {
  id: string;
  Messages: object;
  constructor(id: string, Messages: object) {
    this.id = id;
    this.Messages = Messages;
  }
}
