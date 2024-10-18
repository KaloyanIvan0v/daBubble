export class Reaction {
  id: string;
  author: string;
  time: Date;
  value: string;

  constructor(id: string, author: string, time: Date, value: string) {
    this.id = id;
    this.author = author;
    this.time = time;
    this.value = value;
  }
}
