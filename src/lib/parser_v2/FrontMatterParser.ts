import { AbstractParser } from "./AbstractParser";
import { FrontMatterTokenizer } from "./tokenizers/FrontMatterTokenizer";

export class FrontMatterParser extends AbstractParser<FrontMatterTokenizer> {
  TokenizerClass = FrontMatterTokenizer;

  parse(): [string, string | number | boolean] {
    const keyToken = this.tokenizer.next();

    if (!["identifier", "string"].includes(keyToken.type)) {
      // TODO: make tokenizer.errorToken function and use it here
    }

    throw new Error("Not implemented");
  }
}
