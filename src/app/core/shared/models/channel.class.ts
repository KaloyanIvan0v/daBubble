export class Channel {
  id: string;
  name: string;
  users: object;
  messages: object;

  constructor(id: string, name: string, users: object, messages: object) {
    this.id = id;
    this.name = name;
    this.users = users;
    this.messages = messages;
  }
}
