import { AbstractParser } from "./AbstractParser";
import {
  isDistanceValueWithUnit,
  isSets,
  isWeightValueWithUnit,
  Set,
} from "./ast";
import { Token } from "./tokenizers/AbstractTokenizer";
import { SetTokenizer, SetTokenType } from "./tokenizers/SetTokenizer";

export class SetParser extends AbstractParser<SetTokenizer> {
  TokenizerClass = SetTokenizer;

  parse(): Set {
    let set = {};

    let nextValue = this.readNextValue();
    while (nextValue !== null) {
      set = { ...set, ...nextValue };

      nextValue = this.readNextValue();
    }

    this.skipToNextLine();

    return set;
  }

  readNextValue(): Set | null {
    const token = this.tokenizer.next();

    switch (token.type) {
      case "identifier":
        return this.handleIdentifierToken(token);
      case "operator":
        return this.handleOperatorToken(token);
      case "number":
        return this.handleNumberToken(token);
      case "tagStart":
        return this.handleTagStart(token);
      case "unknown":
        this.tokenizer.errorToken(
          token,
          `Expected identifier, got ${token.value}`
        );
        return null;
      case "newLine":
      case "comment":
      case "eof":
        return null;
    }
  }

  handleOperatorToken(token: Token<SetTokenType>): Set | null {
    if (
      token.type === "operator" &&
      this.caseInsensitiveEquals(token.value, "x")
    ) {
      const reps = this.parseReps();
      return reps ? { reps } : null;
    } else if (token.type === "operator" && token.value === "@") {
      const rpe = this.expectNumber();
      return rpe ? { rpe } : null;
    }

    this.tokenizer.errorToken(token, `Unexpected operator ${token.value}`);
    return null;
  }

  handleIdentifierToken(token: Token<SetTokenType>): Set | null {
    if (this.caseInsensitiveEquals(token.value, "bw")) return { weight: "bw" };

    this.tokenizer.errorToken(token, `Unexpected identifier ${token.value}`);
    return null;
  }

  handleNumberToken(token: Token<SetTokenType>): Set | null {
    const num = this.parseNumber(token.value);

    if (num === null) {
      this.tokenizer.errorToken(token, `Invalid number: ${token.value}`);
      return null;
    }

    const next = this.tokenizer.peek();
    if (next.type === "identifier") {
      this.tokenizer.next();
      const valueWithUnit = { value: num, unit: next.value.toLowerCase() };

      if (isDistanceValueWithUnit(valueWithUnit)) {
        return { distance: valueWithUnit };
      }
      if (isWeightValueWithUnit(valueWithUnit)) {
        return { weight: valueWithUnit };
      }
      if (isSets(valueWithUnit)) {
        return { sets: valueWithUnit.value };
      }

      this.tokenizer.errorToken(
        next,
        `Expected weight, distance, or sets, but got ${next.value}`
      );
    }

    return { weight: num };
  }

  handleTagStart(token: Token<SetTokenType>): Set | null {
    return null;
  }

  parseReps(): number[] | null {
    const result = [];
    do {
      const num = this.expectNumber();

      if (num !== null) result.push(num);
      else {
        return null;
      }
    } while (this.tokenizer.peek().value === ",");

    return result;
  }

  expectNumber(): number | null {
    const numberToken = this.tokenizer.next();
    if (numberToken.type !== "number") {
      this.tokenizer.errorToken(
        numberToken,
        `Expected number, got ${numberToken.value}`
      );
    }

    const num = this.parseNumber(numberToken.value);

    if (num === null) {
      this.tokenizer.errorToken(
        numberToken,
        `Invalid number: ${numberToken.value}`
      );
    }

    return num;
  }

  caseInsensitiveEquals(a: string, b: string) {
    return a.toLowerCase() === b.toLowerCase();
  }
}
