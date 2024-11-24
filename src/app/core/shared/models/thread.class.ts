import { Message } from './message.class';
export class Thread {
  id: string;
  space: string;
  constructor(id: string, space: string, messages: Message[]) {
    this.id = id;
    this.space = space;
  }
}
