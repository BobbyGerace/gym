import { ParserState } from "./parserState";
import { AbstractTokenizer } from "./tokenizers/AbstractTokenizer";

export abstract class AbstractParser<T extends AbstractTokenizer<any>> {
  abstract TokenizerClass: new (parserState: ParserState) => T;
  private _tokenizer?: T;
  private parserState: ParserState;

  constructor(parserState: ParserState) {
    this.parserState = parserState;
  }

  protected get tokenizer() {
    if (this._tokenizer) return this._tokenizer;

    this._tokenizer = new this.TokenizerClass(this.parserState);
    return this._tokenizer;
  }

  skipToNextLine() {
    this.tokenizer.whitespace();
    while (!this.tokenizer.isLineEnd()) {
      this.tokenizer.next();
      this.tokenizer.whitespace();
    }
    this.tokenizer.next();
  }

  parseString(str: string): string {
    let result = "";
    // Limit i to skip opening and closing quotes
    for (let i = 1; i < str.length - 1; i++) {
      if (str[i] === "\\") {
        i++;
        switch (str[i]) {
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
            result += str[i];
            break;
        }
      } else {
        result += str[i];
      }
    }

    return result;
  }

  parseNumber(value: string): number | null {
    if (/^[\d-.]+$/.test(value)) {
      const maybeNum = parseFloat(value);
      if (!isNaN(maybeNum)) {
        return maybeNum;
      }
    }

    return null;
  }
}
