export class User {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  contacts: string[];
  status: boolean;

  constructor(
    uid: string,
    name: string,
    email: string,
    photoURL: string,
    contacts: string[],
    status: boolean
  ) {
    this.uid = uid;
    this.name = name;
    this.email = email;
    this.photoURL = photoURL;
    this.contacts = contacts;
    this.status = status;
  }
}
