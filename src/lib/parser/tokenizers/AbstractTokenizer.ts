import { ParserState } from "../parserState";

export type Token<T> = {
  type: T;
  value: string;
  line: number;
  col: number;
};

export abstract class AbstractTokenizer<T> {
  parserState: ParserState;

  abstract next(): Token<T>;

  constructor(parserState: ParserState) {
    this.parserState = parserState;
  }

  peek(n: number): Token<T>[];
  peek(): Token<T>;
  peek(n?: number): Token<T> | Token<T>[] {
    const revert = this.parserState.save();

    if (n === undefined) {
      const result = this.next();
      revert();
      return result;
    }

    const result = [];
    for (let i = 0; i < n; i++) {
      result.push(this.next());
    }
    revert();
    return result;
  }

  takeWhile(predicate: (char: string) => boolean): string {
    let result = "";

    while (!this.isLineEnd() && predicate(this.parserState.char())) {
      result += this.parserState.inc();
    }
    return result;
  }

  takeWhileElemOf(elements: string): string {
    return this.takeWhile((char) => elements.includes(char));
  }

  whitespace(): string {
    return this.takeWhile((char) => /[ \t]/.test(char));
  }

  newLine(): string {
    let result = "";
    if (this.parserState.char() === "\r") result += this.parserState.inc();
    if (this.parserState.char() === "\n") result += this.parserState.inc();
    this.parserState.incLine();
    return result;
  }

  // Note that we don't validate the number here. That's the parser's job
  readNumber(): string {
    let result = "";
    if (this.parserState.char() === "-") {
      result += this.parserState.inc();
    }

    result += this.takeWhile((char) => /[\d]/.test(char));

    if (this.parserState.char() === ".") {
      result += this.parserState.inc();
      result += this.takeWhile((char) => /[\d]/.test(char));
    }

    return result;
  }

  readString(): string {
    let chars = '"';

    // skip the opening quote
    this.parserState.inc();

    chars += this.takeWhile((char) => {
      const last = this.parserState.input[this.parserState.pos - 1];
      return char !== '"' || last === "\\";
    });

    if (this.parserState.char() === '"') {
      chars += '"';
      this.parserState.inc();
    }

    return chars;
  }

  wrapToken(type: T, fn: () => string): Token<T> {
    const { line, col } = this.parserState;
    const value = fn();
    return { type, value, line, col };
  }

  /**
   * Checks if end of input or end of line is reached
   */
  isLineEnd(): boolean {
    return this.parserState.isEOF() || /[\n\r]/.test(this.parserState.char());
  }

  isComment(): boolean {
    return this.parserState.peek(2) === "//";
  }

  errorToken(token: Token<T>, message: string): Token<T> {
    this.parserState.error(message, token.line, token.col, token.value.length);
    return token;
  }

  hasNext(): boolean {
    return !this.parserState.isEOF();
  }
}
