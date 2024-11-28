import { Message } from './message.class';
import { User } from './user.class';

export class DirectMessage {
  uid: string[];
  id: string;
  authorUid: string;
  recipientUid: string;
  timestamp: Date;
  messages: Message[];

  constructor(
    uid: string[],
    id: string,
    authorUid: string,
    recipientUid: string,
    timestamp: Date,
    messages: Message[]
  ) {
    this.uid = uid;
    this.id = id;
    this.authorUid = authorUid;
    this.recipientUid = recipientUid;
    this.timestamp = timestamp;
    this.messages = messages;
  }
}
