import { AbstractTokenizer, Token } from "./AbstractTokenizer";

const digits = "0123456789";
const operators = ",:";

type TagTokenType =
  | "tagStart"
  | "tagEnd"
  | "identifier"
  | "number"
  | "operator"
  | "string"
  | "newLine"
  | "eof"
  | "unknown";

export class TagTokenizer extends AbstractTokenizer<TagTokenType> {
  next(): Token<TagTokenType> {
    // throw away whitespace
    this.whitespace();

    const nextChar = this.parserState.char();

    if (this.parserState.isEOF()) {
      return this.wrapToken("eof", () => "");
    } else if (/^[a-zA-Z_]$/.test(nextChar)) {
      return this.wrapToken("identifier", () => {
        return this.takeWhile((char) => /[a-zA-Z0-9_-]/.test(char));
      });
    } else if (
      digits.includes(nextChar) ||
      nextChar === "." ||
      nextChar === "-"
    ) {
      return this.wrapToken("number", () => this.readNumber());
    } else if (operators.includes(nextChar)) {
      return this.wrapToken("operator", () => this.parserState.inc());
    } else if (nextChar === '"') {
      return this.wrapToken("string", () => {
        return this.readString();
      });
    } else if (/[\n\r]/.test(nextChar)) {
      return this.wrapToken("newLine", () => this.newLine());
    } else if (nextChar === "{") {
      return this.wrapToken("tagStart", () => this.parserState.inc());
    } else if (nextChar === "}") {
      return this.wrapToken("tagEnd", () => this.parserState.inc());
    } else {
      return this.wrapToken("unknown", () => this.parserState.inc());
    }
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
}
