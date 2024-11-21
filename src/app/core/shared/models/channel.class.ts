import { Message } from './message.class';

export class Channel {
  uid: string[];
  id: string;
  name: string;
  description: string;
  creator: string;

  constructor(
    id: string,
    name: string,
    description: string,
    creator: string,
    uid: []
  ) {
    this.uid = uid;
    this.id = id;
    this.name = name;
    this.description = description;
    this.creator = creator;
  }
}
