export class Chat {
  uid: string[];
  id: string;
  Messages: object;
  constructor(id: string, Messages: object, uid: []) {
    this.uid = uid;
    this.id = id;
    this.Messages = Messages;
  }
}
