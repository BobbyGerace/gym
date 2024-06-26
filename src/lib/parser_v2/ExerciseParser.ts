import { AbstractParser } from "./AbstractParser";
import { Exercise } from "./ast";
import { ExerciseTokenizer } from "./tokenizers/ExerciseTokenizer";

export class ExerciseParse extends AbstractParser<ExerciseTokenizer> {
  TokenizerClass = ExerciseTokenizer;

  parse(): Exercise | null {
    // TODO: Pull in test cases from exercise-parser.test.ts
    // TODO: Implement the parser
    throw "TODO";
  }
}
