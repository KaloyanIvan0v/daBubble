import { Reaction } from './reaction.class';
import { Thread } from './thread.class';
export class Message {
  id: string;
  author: string;
  time: Date;
  location: {
    collection: string;
    docId: string;
  };
  value: {
    text: string;
    imports: string[];
  };
  thread: Thread;
  space: string;
  reactions: Reaction[];

  constructor(
    id: string,
    author: string,
    time: Date,
    value: { text: string; imports: string[] },
    thread: Thread,
    space: string,
    reactions: Reaction[]
  ) {
    this.id = id;
    this.author = author;
    this.time = time;
    this.location = { collection: '', docId: '' };
    this.value = value;
    this.thread = thread;
    this.space = space;
    this.reactions = reactions;
  }
}
