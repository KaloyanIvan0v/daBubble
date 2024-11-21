export class Reaction {
  id: string;
  authors: string[];
  value: string;

  constructor(id: string, authors: string[], value: string) {
    this.id = id;
    this.authors = authors;
    this.value = value;
  }

  toPlainObject(): any {
    return {
      id: this.id,
      authors: this.authors,
      value: this.value,
    };
  }
}
