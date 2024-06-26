import { AbstractTokenizer, Token } from "./AbstractTokenizer";

const operators = "#&";

export type ExerciseTokenType =
  | "operator"
  | "exerciseName"
  | "newLine"
  | "comment"
  | "eof";

export class ExerciseTokenizer extends AbstractTokenizer<ExerciseTokenType> {
  next(): Token<ExerciseTokenType> {
    // throw away whitespace
    this.whitespace();

    const nextChar = this.parserState.char();

    if (this.parserState.isEOF()) {
      return this.wrapToken("eof", () => "");
    } else if (operators.includes(nextChar)) {
      return this.wrapToken("operator", () => this.parserState.inc());
    } else if (/[\n\r]/.test(nextChar)) {
      return this.wrapToken("newLine", () => this.newLine());
    } else if (this.isComment()) {
      return this.wrapToken("comment", () => {
        // takeWhile already stops at line end
        return this.takeWhile(() => true);
      });
    } else {
      return this.wrapToken("exerciseName", () =>
        this.takeWhile(() => !this.isComment()).trim()
      );
    }
  }
}
