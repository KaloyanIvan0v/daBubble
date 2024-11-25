export class Thread {
  originMessagePath: string;
  space: string;
  constructor(originMessagePath: string, space: string) {
    this.space = space;
    this.originMessagePath = originMessagePath;
  }
}
