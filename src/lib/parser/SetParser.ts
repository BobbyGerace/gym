import { AbstractParser } from "./AbstractParser";
import { TagParser } from "./TagParser";
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
    const token = this.tokenizer.peek();

    switch (token.type) {
      case "identifier":
        return this.handleIdentifierToken();
      case "operator":
        return this.handleOperatorToken();
      case "number":
        return this.handleNumberToken();
      case "tagStart":
        return this.handleTagStart();
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

  handleOperatorToken(): Set | null {
    const token = this.tokenizer.next();
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

  handleIdentifierToken(): Set | null {
    const token = this.tokenizer.next();
    if (this.caseInsensitiveEquals(token.value, "bw")) return { weight: "bw" };

    this.tokenizer.errorToken(token, `Unexpected identifier ${token.value}`);
    return null;
  }

  handleNumberToken(): Set | null {
    const token = this.tokenizer.next();
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
      return null;
    }

    if (next.type === "operator" && next.value === ":") {
      return this.parseTime(num);
    }

    return { weight: num };
  }

  // This function starts from the colon, accepting the first
  // component of the time as a parameter
  parseTime(primary: number): Set | null {
    const colonToken = this.tokenizer.next();
    if (colonToken.type !== "operator" || colonToken.value !== ":") {
      // Sanity check: This shouldn't happen
      throw new Error("Parse error: Expected colon");
    }

    const secondary = this.expectNumber();
    if (secondary === null) return null;

    const secondColonToken = this.tokenizer.peek();
    if (
      secondColonToken.type === "operator" &&
      secondColonToken.value === ":"
    ) {
      this.tokenizer.next();
      const tertiary = this.expectNumber();
      if (tertiary === null) return null;

      return {
        time: { hours: primary, minutes: secondary, seconds: tertiary },
      };
    }

    return { time: { hours: 0, minutes: primary, seconds: secondary } };
  }

  handleTagStart(): Set | null {
    const tags = new TagParser(this.tokenizer.parserState).parse();

    if (tags === null || tags.length === 0) return null;

    return { tags };
  }

  parseReps(): number[] | null {
    const result = [];
    do {
      const num = this.expectNumber();

      if (num !== null) result.push(num);
      else {
        return null;
      }
    } while (this.consumeIfComma());

    return result;
  }

  expectNumber(): number | null {
    const numberToken = this.tokenizer.next();
    if (numberToken.type !== "number") {
      this.tokenizer.errorToken(
        numberToken,
        `Expected number, got ${numberToken.value}`
      );
      return null;
    }

    const num = this.parseNumber(numberToken.value);

    if (num === null) {
      this.tokenizer.errorToken(
        numberToken,
        `Invalid number: ${numberToken.value}`
      );
      return null;
    }

    return num;
  }

  consumeIfComma(): boolean {
    const token = this.tokenizer.peek();
    if (token.type === "operator" && token.value === ",") {
      this.tokenizer.next();
      return true;
    }
    return false;
  }

  caseInsensitiveEquals(a: string, b: string) {
    return a.toLowerCase() === b.toLowerCase();
  }
}
