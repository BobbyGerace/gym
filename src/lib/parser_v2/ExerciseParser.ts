import { AbstractParser } from "./AbstractParser";
import { SetParser } from "./SetParser";
import { Exercise } from "./ast";
import { ExerciseTokenizer } from "./tokenizers/ExerciseTokenizer";

type InternalExercise = Omit<Exercise, "sequence" | "subsequence"> & {
  isSuperset: boolean;
};

export class ExerciseParser extends AbstractParser<ExerciseTokenizer> {
  TokenizerClass = ExerciseTokenizer;

  parse(): InternalExercise | null {
    const operatorToken = this.tokenizer.next();

    if (operatorToken.type !== "operator") {
      this.tokenizer.errorToken(
        operatorToken,
        `Expected operator but got ${operatorToken.value}`
      );
      return null;
    }

    const isSuperset = operatorToken.value === "&";

    const exerciseNameToken = this.tokenizer.next();

    if (exerciseNameToken.type !== "exerciseName") {
      this.tokenizer.errorToken(
        exerciseNameToken,
        `Expected string but got ${exerciseNameToken.value}`
      );
      return null;
    }

    this.skipToNextContent();

    const sets = [];
    while (
      this.tokenizer.hasNext() &&
      this.tokenizer.peek().type !== "operator"
    ) {
      const set = this.parseSet();
      if (Object.keys(set).length !== 0) {
        sets.push(set);
      }
    }

    return {
      sets,
      isSuperset,
      name: exerciseNameToken.value,
      lineStart: operatorToken.line,
      lineEnd: this.tokenizer.hasNext()
        ? this.tokenizer.peek().line - 1
        : this.tokenizer.parserState.line,
    };
  }

  parseSet() {
    return new SetParser(this.tokenizer.parserState).parse();
  }
}
