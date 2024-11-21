import { Message } from './message.class';
export class Thread {
  id: string;
  space: string;
  messages: Message[];
  constructor(id: string, space: string, messages: Message[]) {
    this.id = id;
    this.space = space;
    this.messages = messages;
  }

  // toPlanObject() {
  //   return {
  //     id: this.id,
  //     space: this.space,
  //     messages: this.messages,
  //   };
  // }
}
