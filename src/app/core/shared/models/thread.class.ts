export class Thread {
  id: string;
  space: string;
  messages: object;
  constructor(id: string, space: string, messages: object, uid: []) {
    this.id = id;
    this.space = space;
    this.messages = messages;
  }
}
