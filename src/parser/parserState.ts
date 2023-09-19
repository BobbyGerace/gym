export const newState = (input: string): ParserState => new ParserState(input);

export class ParserState {
  input: string;
  private _pos: number;
  private _line: number;
  private _col: number;

  constructor(input: string) {
    this.input = input;
    this._pos = 0;
    this._line = 1;
    this._col = 1;
  }

  get pos(): number {
    return this._pos;
  }

  get line(): number {
    return this._line;
  }

  get col(): number {
    return this._col;
  }

  inc(n = 1) {
    this._pos += n;
    this._col += n;
  }

  incLine() {
    this._line++;
    this._col = 1;
  }

  explore(fn: (rollback: () => void) => void): void {
    const pos = this._pos;
    fn(() => {
      this._pos = pos;
    });
  }

  isEOF(): boolean {
    return this._pos >= this.input.length;
  }
}
