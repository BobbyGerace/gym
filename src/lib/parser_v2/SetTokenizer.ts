import { AbstractTokenizer, Token } from "./AbstractTokenizer";

// X has special meaning in the set syntax, so we exclude it from the set of letters
const lettersWithoutX = "abcdefghijklmnopqrstuvwyzABCDEFGHIJKLMNOPQRSTUVWYZ";
const digits = "0123456789";
const operators = "x@:";

type SetTokenType =
  | "identifier"
  | "number"
  | "operator"
  | "tagStart"
  | "unknown"
  | "newLine"
  | "eof";

export class SetTokenizer extends AbstractTokenizer<SetTokenType> {
  next(): Token<SetTokenType> {
    // throw away whitespace
    this.whitespace();

    const nextChar = this.parserState.char();

    if (this.parserState.isEOF()) {
      return this.wrapToken("eof", () => "");
    } else if (lettersWithoutX.includes(nextChar)) {
      return this.wrapToken("identifier", () => {
        return this.takeWhile((char) => lettersWithoutX.includes(char));
      });
    } else if (
      digits.includes(nextChar) ||
      nextChar === "." ||
      nextChar === "-"
    ) {
      return this.wrapToken("number", () => this.readNumber());
    } else if (operators.includes(nextChar)) {
      return this.wrapToken("operator", () => this.parserState.inc());
    } else if (/[\n\r]/.test(nextChar)) {
      return this.wrapToken("newLine", () => this.newLine());
    } else if (nextChar === "{") {
      return this.wrapToken("tagStart", () => this.parserState.inc());
    } else {
      return this.wrapToken("unknown", () => this.parserState.inc());
    }
  }
}
