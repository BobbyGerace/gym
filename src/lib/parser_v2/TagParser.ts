import { AbstractParser } from "./AbstractParser";
import { Tag } from "./ast";
import { TagTokenizer, TagTokenType } from "./tokenizers/TagTokenizer";

export class TagParser extends AbstractParser<TagTokenizer> {
  TokenizerClass = TagTokenizer;

  parse(): Tag[] | null {
    const tags: Tag[] = [];

    const openingBraceToken = this.tokenizer.next();
    if (openingBraceToken.type !== "tagStart") {
      this.tokenizer.errorToken(
        openingBraceToken,
        `Expected { but got ${openingBraceToken.value}`
      );
      return tags;
    }

    do {
      const tag = this.parseTag();
      if (tag === null) {
        this.skipToNextLine();
        return null;
      }
      tags.push(tag);
    } while (this.consumeIfComma());

    const closingBraceToken = this.tokenizer.next();
    if (closingBraceToken.type !== "tagEnd") {
      this.tokenizer.errorToken(
        closingBraceToken,
        `Expected } but got ${closingBraceToken.value}`
      );
    }

    return tags;
  }

  parseTag(): Tag | null {
    const keyToken = this.tokenizer.next();
    let key = "";
    if (keyToken.type === "string") {
      key = this.parseString(keyToken.value);
    } else if (keyToken.type === "identifier") {
      key = keyToken.value;
    } else {
      this.tokenizer.errorToken(
        keyToken,
        `Expected string or identifier but got ${keyToken.value}`
      );
      return null;
    }

    const colonToken = this.tokenizer.peek();
    if (colonToken.type === "operator" && colonToken.value === ":") {
      this.tokenizer.next();
      const valueToken = this.tokenizer.next();

      if (valueToken.type === "string") {
        const value = this.parseString(valueToken.value);
        return { key, value };
      }
      if (valueToken.type === "number") {
        const value = this.parseNumber(valueToken.value);
        if (value === null) {
          this.tokenizer.errorToken(
            valueToken,
            `Invalid number: ${valueToken.value}`
          );
          return null;
        }
        return { key, value };
      }
      if (valueToken.type === "identifier") {
        if (valueToken.value === "true") {
          return { key, value: true };
        }
        if (valueToken.value === "false") {
          return { key, value: false };
        }
        return { key, value: valueToken.value };
      }

      this.tokenizer.errorToken(
        valueToken,
        `Expected string, number, or identifier but got ${valueToken.value}`
      );
    }

    return { key };
  }

  consumeIfComma(): boolean {
    const commaToken = this.tokenizer.peek();
    if (commaToken.type === "operator" && commaToken.value === ",") {
      this.tokenizer.next();
      return true;
    }
    return false;
  }
}
