import { AbstractParser } from "./AbstractParser";
import { Workout } from "./ast";
import { AbstractTokenizer } from "./tokenizers/AbstractTokenizer";

class DocumentTokenizer extends AbstractTokenizer<any> {
  next(): any {
    throw "TODO: Implement";
  }
}

export class DocumentParser extends AbstractParser<DocumentTokenizer> {
  TokenizerClass = DocumentTokenizer;

  parse(): Workout | null {
    throw "TODO: Implement";
  }
}
