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
}
