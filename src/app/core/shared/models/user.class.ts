export class User {
  name: string;
  email: string;
  imgPath: string;
  contacts: string[];
  status: boolean;

  constructor(
    name: string,
    email: string,
    imgPath: string,
    contacts: string[],
    status: boolean
  ) {
    this.name = name;
    this.email = email;
    this.imgPath = imgPath;
    this.contacts = contacts;
    this.status = status;
  }
}
