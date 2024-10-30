export class User {
  uid: string;
  name: string;
  email: string;
  imgPath: string;
  contacts: string[];
  status: boolean;

  constructor(
    uid: string,
    name: string,
    email: string,
    imgPath: string,
    contacts: string[],
    status: boolean
  ) {
    this.uid = uid;
    this.name = name;
    this.email = email;
    this.imgPath = imgPath;
    this.contacts = contacts;
    this.status = status;
  }
}
