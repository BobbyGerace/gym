import { AbstractParser } from "./AbstractParser";
import { Set } from "./ast";
import { Token } from "./tokenizers/AbstractTokenizer";
import { SetTokenizer, SetTokenType } from "./tokenizers/SetTokenizer";

class SetParseError extends Error {
  token: Token<SetTokenType>;
  constructor(message: string, token: Token<SetTokenType>) {
    super(message);
    this.name = "SetParseError";
    this.token = token;
  }
}

export class SetParser extends AbstractParser<SetTokenizer> {
  TokenizerClass = SetTokenizer;

  parse(): Set {
    const set: Set = {};

    try {
      while (!this.tokenizer.isLineEnd()) {
        const token = this.tokenizer.next();

        if (token.type === "unknown") {
          this.tokenizer.errorToken(
            token,
            `Expected identifier, got ${token.value}`
          );
          this.skipToNextLine();
          return set;
        } else if (
          token.type === "operator" &&
          this.caseInsensitiveEquals(token.value, "x")
        ) {
          set.reps = this.parseReps();
        } else if (token.type === "operator" && token.value === "@") {
          set.rpe = this.expectNumber();
        } else if (
          token.type === "identifier" &&
          this.caseInsensitiveEquals(token.value, "bw")
        ) {
          set.weight = "bw";
        } else if (token.type === "number" && this.nextIsWeightUnit()) {
        } else if (token.type === "number" && this.nextIsDistanceUnit()) {
        } else if (token.type === "number" && this.nextIsSets()) {
        } else if (token.type === "number" && this.nextIsTime()) {
        } else if (token.type === "number") {
          const next = this.tokenizer.next();
          throw new SetParseError(
            `Expected weight, distance, or sets, but got ${next.value}`,
            next
          );
        }
        // switch (token.type) {
        //   case "identifier":
        //   case "number":
        //   case "operator":
        //   case "tagStart":
        //   case "unknown":
        //   case "newLine":
        //   case "comment":
        //   case "eof":
        // }
      }
    } catch (error) {
      if (error instanceof SetParseError) {
        this.tokenizer.errorToken(error.token, error.message);
        this.skipToNextLine();
      } else {
        throw error;
      }
    }

    return set;
  }

  parseReps(): number[] {
    const result = [];
    do {
      result.push(this.expectNumber());
    } while (this.tokenizer.peek().value === ",");

    return result;
  }

  expectNumber(): number {
    const numberToken = this.tokenizer.next();
    if (numberToken.type !== "number") {
      throw new SetParseError(
        `Expected number, got ${numberToken.value}`,
        numberToken
      );
    }

    const num = this.parseNumber(numberToken.value);

    if (num === null) {
      throw new SetParseError(
        `Invalid number: ${numberToken.value}`,
        numberToken
      );
    }

    return num;
  }

  nextIsWeightUnit(): boolean {
    throw "stub";
  }

  nextIsDistanceUnit(): boolean {
    throw "stub";
  }

  nextIsSets(): boolean {
    throw "stub";
  }

  nextIsTime(): boolean {
    throw "stub";
  }

  caseInsensitiveEquals(a: string, b: string) {
    return a.toLowerCase() === b.toLowerCase();
  }
}
