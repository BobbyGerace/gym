import { brzyckiFormulas, epleyFormulas } from "../lib/calc";
import { Config } from "../lib/config";
import { logger } from "../lib/logger";
import { Set, parseSet } from "../lib/parser";

export class CalcController {
  private config: Config;
  constructor(config: Config) {
    this.config = config;
  }

  e1rm = async (set: string, options: { formula?: Config["e1rmFormula"] }) => {
    const formula = options.formula || this.config.e1rmFormula;

    const { weight, reps } = this.getSetData(set);

    if (!weight || !reps) {
      throw new Error("Weight and reps are required");
    }

    const formulaGroup =
      formula === "brzycki" ? brzyckiFormulas : epleyFormulas;

    const max = formulaGroup.max(this.extractWeight(weight), reps);

    logger.log(this.round2(max).toString());
  };

  convertRpe = async (
    fromSet: string,
    toSet: string,
    options: { formula?: Config["e1rmFormula"] }
  ) => {
    const formula = options.formula || this.config.e1rmFormula;

    const { weight, reps } = this.getSetData(fromSet);
    const {
      reps: toReps,
      weight: toWeight,
      rpe: toRpe,
    } = this.getSetData(toSet);

    if (!weight || !reps) {
      throw new Error("Weight and reps are required in first argument");
    }

    const formulaGroup =
      formula === "brzycki" ? brzyckiFormulas : epleyFormulas;

    const max = formulaGroup.max(this.extractWeight(weight), reps);

    if (!toReps) {
      const repsToSubtract = toRpe ? 10 - toRpe : 0;
      const result = Math.floor(
        formulaGroup.reps(max, toWeight) - repsToSubtract
      );
      logger.log(`x${Math.max(0, result)}`);
    } else if (!toWeight) {
      const result = this.round2(formulaGroup.weight(max, toReps));
      logger.log(Math.max(0, result).toString());
    } else if (!toRpe) {
      const possibleReps = formulaGroup.reps(max, toWeight) - toReps;
      const rpe = 10 - Math.floor(2 * possibleReps) / 2;
      if (rpe > 10) {
        logger.log(`>@10`);
      } else {
        logger.log(`@${rpe}`);
      }
    } else {
      throw new Error("Cannot convert to a set with all values");
    }
  };

  private getSetData = (set: string) => {
    const { result, errors } = parseSet(set);

    if (errors.length > 0) {
      throw new Error(
        "Invalid set syntax. Use the same syntax as in a workout file. e. E.g., 100x5@8"
      );
    }

    const { weight, reps, rpe } = result;

    const maxReps = reps && Math.max(...reps);
    return {
      reps: maxReps ? this.adjustReps(maxReps, rpe) : null,
      weight: this.extractWeight(weight),
      rpe,
    };
  };

  private adjustReps = (reps: number, rpe = 10) => {
    return reps + (10 - rpe);
  };

  private extractWeight = (weight: Set["weight"]): number => {
    if (!weight) return 0;

    if (typeof weight === "number") {
      return weight;
    }

    if (weight === "bw") return 0;

    return weight.value;
  };

  private round2 = (num: number) => {
    return Math.round(num * 100) / 100;
  };
}
