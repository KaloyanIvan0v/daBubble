export class DirectChat {
  id: string;
  receiver: {
    name: string;
    photoURL: string;
    uid: string;
  };
  sender: {
    name: string;
    photoURL: string;
    uid: string;
  };
  timestamp: Date;
  uid: string[] = [];

  constructor(
    id: string,
    receiver: { name: string; photoURL: string; uid: string },
    sender: { name: string; photoURL: string; uid: string },
    timestamp: Date
  ) {
    this.id = id;
    this.receiver = receiver;
    this.sender = sender;
    this.timestamp = timestamp;
  }
}
