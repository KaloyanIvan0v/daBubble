import { Message } from './message.class';
export class Thread {
  id: string;
  space: string;
  messages: Message[];
  constructor(id: string, space: string, messages: Message[], uid: []) {
    this.id = id;
    this.space = space;
    this.messages = messages;
  }
}
