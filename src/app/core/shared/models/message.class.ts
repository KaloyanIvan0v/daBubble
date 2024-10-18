export class Message {
  id: string;
  author: string;
  time: Date;
  value: string;
  thread: object;
  space: string;
  reactions: object;

  constructor(
    id: string,
    author: string,
    time: Date,
    value: string,
    thread: object,
    space: string,
    reactions: object
  ) {
    this.id = id;
    this.author = author;
    this.time = time;
    this.value = value;
    this.thread = thread;
    this.space = space;
    this.reactions = reactions;
  }
}
