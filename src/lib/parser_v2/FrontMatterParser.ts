import { AbstractParser } from "./AbstractParser";
import { FrontMatterTokenizer } from "./tokenizers/FrontMatterTokenizer";

export class FrontMatterParser extends AbstractParser<FrontMatterTokenizer> {
  TokenizerClass = FrontMatterTokenizer;

  parse(): Record<string, string | number | boolean> {
    const delimiterToken = this.tokenizer.next();
    if (delimiterToken.type !== "delimiter") {
      this.tokenizer.errorToken(
        delimiterToken,
        `Expected --- but got ${delimiterToken.value}`
      );
      return {};
    }

    this.skipToNextLine();

    const frontMatter: Record<string, string | number | boolean> = {};

    while (
      this.tokenizer.hasNext() &&
      this.tokenizer.peek().type !== "delimiter"
    ) {
      console.log(this.tokenizer.peek());
      const parsedLine = this.parseLine();
      if (parsedLine === null) {
        continue;
      }
      const [key, value] = parsedLine;
      frontMatter[key] = value;
    }

    const closingDelimiterToken = this.tokenizer.next();
    if (closingDelimiterToken.type !== "delimiter") {
      this.tokenizer.errorToken(
        closingDelimiterToken,
        `Expected --- but got ${closingDelimiterToken.value}`
      );
    }

    return frontMatter;
  }

  parseLine(): [string, string | number | boolean] | null {
    const keyToken = this.tokenizer.next();

    if (!["identifier", "string"].includes(keyToken.type)) {
      this.tokenizer.errorToken(
        keyToken,
        `Expected identifier or string but got ${keyToken.value}`
      );
      this.skipToNextLine();
      console.log(keyToken);
      return null;
    }

    const colonToken = this.tokenizer.next();
    if (colonToken.type !== "colon") {
      this.tokenizer.errorToken(
        colonToken,
        `Expected : but got ${colonToken.value}`
      );
      this.skipToNextLine();
      console.log(colonToken);
      return null;
    }

    const valueToken = this.tokenizer.nextTokenAfterColon();
    if (!["string", "implicit"].includes(valueToken.type)) {
      this.tokenizer.errorToken(
        valueToken,
        `Expected string or value but got ${valueToken.value}`
      );
      this.skipToNextLine();
      console.log(valueToken);
      return null;
    }

    this.skipToNextLine();
    console.log(valueToken);

    const key =
      keyToken.type === "string"
        ? this.parseString(keyToken.value)
        : keyToken.value;

    const value =
      valueToken.type === "string"
        ? this.parseString(valueToken.value)
        : this.handleImplicitValue(valueToken.value);

    return [key, value];
  }

  handleImplicitValue(value: string): string | number | boolean {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }

    const maybeNum = this.parseNumber(value);
    if (maybeNum !== null) {
      return maybeNum;
    }

    return value;
  }
}
