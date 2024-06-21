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
        this.parserState.inc();
        return this.parseString();
      });
    } else if (/[\n\r]/.test(nextChar)) {
      return this.wrapToken("newLine", () => this.newLine());
    } else if (nextChar === "{") {
      return this.wrapToken("tagStart", () => this.parserState.inc());
    } else {
      return this.wrapToken("unknown", () => this.parserState.inc());
    }
  }

  parseString(): string {
    let result = "";
    while (
      this.parserState.pos < this.parserState.input.length &&
      !/^["\n]/.test(this.parserState.char())
    ) {
      if (this.parserState.char() === "\\") {
        this.parserState.inc();
        switch (this.parserState.char()) {
          case "n":
            result += "\n";
            break;
          case "r":
            result += "\r";
            break;
          case "t":
            result += "\t";
            break;
          case "v":
            result += "\v";
            break;
          case "f":
            result += "\f";
            break;
          case "b":
            result += "\b";
            break;
          case "\\":
            result += "\\";
            break;
          case '"':
            result += '"';
            break;
          default:
            result += this.parserState.char();
            break;
        }
      } else {
        result += this.parserState.char();
      }
      this.parserState.inc();
    }

    return result;
  }
}
