import { AbstractTokenizer, Token } from "./AbstractTokenizer";

const digits = "0123456789";

export type FrontMatterTokenType =
  | "delimiter"
  | "identifier"
  | "colon"
  | "string"
  | "implicit"
  | "comment"
  | "newLine"
  | "eof"
  | "unknown";

export class FrontMatterTokenizer extends AbstractTokenizer<FrontMatterTokenType> {
  next(): Token<FrontMatterTokenType> {
    this.whitespace();

    const nextChar = this.parserState.char();

    if (this.parserState.isEOF()) {
      return this.wrapToken("eof", () => "");
    } else if (this.parserState.peek(3) === "---") {
      return this.wrapToken("delimiter", () => {
        return this.takeWhile((char) => char === "-");
      });
    } else if (/^[a-zA-Z_]$/.test(nextChar)) {
      return this.wrapToken("identifier", () => {
        return this.takeWhile((char) => /[a-zA-Z0-9_-]/.test(char));
      });
    } else if (nextChar === ":") {
      return this.wrapToken("colon", () => this.parserState.inc());
    } else if (nextChar === '"') {
      return this.wrapToken("string", () => {
        return this.readString();
      });
    } else if (this.isComment()) {
      return this.wrapToken("comment", () => {
        // takeWhile already stops at line end
        return this.takeWhile(() => true);
      });
    } else if (/[\n\r]/.test(nextChar)) {
      return this.wrapToken("newLine", () => this.newLine());
    } else {
      return this.wrapToken("unknown", () => this.parserState.inc());
    }
  }

  nextTokenAfterColon(): Token<FrontMatterTokenType> {
    // throw away whitespace
    this.whitespace();

    const nextChar = this.parserState.char();

    if (this.parserState.isEOF()) {
      return this.wrapToken("eof", () => "");
    } else if (nextChar === '"') {
      return this.wrapToken("string", () => {
        return this.readString();
      });
    } else if (/[\n\r]/.test(nextChar)) {
      return this.wrapToken("newLine", () => this.newLine());
    } else if (this.isComment()) {
      return this.wrapToken("comment", () => {
        // takeWhile already stops at line end
        return this.takeWhile(() => true);
      });
    } else {
      return this.wrapToken("implicit", () =>
        this.takeWhile(() => !this.isComment()).trim()
      );
    }
  }
}
