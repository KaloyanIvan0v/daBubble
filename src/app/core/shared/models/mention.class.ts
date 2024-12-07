export class Mention {
  displayName: string; // z. B. "MusterUser"
  uid: string;
  constructor(displayName: string, uid: string) {
    this.displayName = displayName;
    this.uid = uid;
  }
}
