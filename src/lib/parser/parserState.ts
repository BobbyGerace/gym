export const newState = (input: string): ParserState => new ParserState(input);

export type ParseError = {
  message: string;
  line: number;
  col: number;
  length: number;
};

export class ParserState {
  input: string;
  errors: ParseError[] = [];
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

  peek(n = 1): string {
    return this.input.slice(this.pos, this.pos + n);
  }

  char() {
    return this.input[this.pos];
  }

  inc(n = 1) {
    let result = this.input.slice(this.pos, this.pos + n);
    this._pos += n;
    this._col += n;
    return result;
  }

  incLine() {
    this._line++;
    this._col = 1;
  }

  save(): () => void {
    const pos = this._pos;
    const line = this._line;
    const col = this._col;
    return () => {
      this._pos = pos;
      this._line = line;
      this._col = col;
    };
  }

  isEOF(): boolean {
    return this._pos >= this.input.length;
  }

  error(message: string, line = this.line, col = this.col, length = 1) {
    this.errors.push({ message, line, col, length });
  }
}
