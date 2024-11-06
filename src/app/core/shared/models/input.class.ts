export class InputBoxData {
  message: string;
  imports: string[];
  constructor(message: string, imports: string[]) {
    this.message = message;
    this.imports = imports;
  }
}
