export class Channel {
  id: string;
  name: string;
  description: string;
  users: object;
  creator: string;
  messages: object;

  constructor(
    id: string,
    name: string,
    description: string,
    users: object,
    messages: object,
    creator: string
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.users = users;
    this.creator = creator;
    this.messages = messages;
  }
}
