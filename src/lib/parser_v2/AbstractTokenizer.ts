import { ParserState } from "./parserState";

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
}
