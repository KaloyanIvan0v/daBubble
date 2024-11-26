import { Reaction } from './reaction.class';
import { Thread } from './thread.class';

export class DirectMessage {
  id: string;
  authorUid: string;
  recipientUid: string;
  timestamp: Date;
  content: {
    text: string;
    attachments?: string[];
  };
  reactions: Reaction[];
  thread?: Thread | null;

  constructor(
    id: string,
    authorUid: string,
    recipientUid: string,
    timestamp: Date,
    content: { text: string; attachments?: string[] },
    reactions: Reaction[] = [],
    thread?: Thread | null
  ) {
    this.id = id;
    this.authorUid = authorUid;
    this.recipientUid = recipientUid;
    this.timestamp = timestamp;
    this.content = content;
    this.reactions = reactions;
    this.thread = thread || null;
  }
}
