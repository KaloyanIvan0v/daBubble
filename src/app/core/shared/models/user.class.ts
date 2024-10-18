export class User {
  id: string;
  name: string;
  email: string;
  imgPath: string;
  channels: string[];
  contacts: string[];
  status: boolean;

  constructor(
    id: string,
    name: string,
    email: string,
    imgPath: string,
    channels: string[],
    contacts: string[],
    status: boolean
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.imgPath = imgPath;
    this.channels = channels;
    this.contacts = contacts;
    this.status = status;
  }
}
