import { ParserState } from "./parserState";
import { takeWhile, whitespace, expect, error, parseIdentifier } from "./util";
import {
  Set,
  Tag,
  Time,
  ValueWithUnit,
  allUnits,
  isDistanceValueWithUnit,
  isWeightValueWithUnit,
} from "./ast";

const parseNumber = (state: ParserState): number => {
  let num = "";
  if (state.input[state.pos] === "-") {
    state.inc();
    num += "-";
  }
  num += takeWhile(state, (char) => /[0-9]/.test(char));
  if (state.input[state.pos] === ".") {
    state.inc();
    num += ".";
    num += takeWhile(state, (char) => /[0-9]/.test(char));
  }

  const result = parseFloat(num);

  if (isNaN(result)) {
    error(state, `Expected number, got ${num}`);
  }
  return result;
};

const parseRpe = (state: ParserState): number => {
  if (state.input[state.pos] !== "@") {
    return NaN;
  }
  state.inc();
  whitespace(state);
  return parseNumber(state);
};

const parseReps = (state: ParserState): number[] => {
  expect(state, "x");
  const reps: number[] = [];

  do {
    whitespace(state);
    const rep = parseNumber(state);
    reps.push(rep);
    whitespace(state);
  } while (parseComma(state));
  return reps;
};

const parseWithUnit = (
  state: ParserState
): ValueWithUnit<typeof allUnits[number]> => {
  const value = parseNumber(state);
  whitespace(state);
  const unit = takeWhile(state, (char) => /[a-zA-Z]/.test(char)).toLowerCase();
  if (!allUnits.includes(unit as any)) {
    error(state, `Expected unit, got ${unit}`);
  }
  return { value, unit: unit as typeof allUnits[number] };
};

const parseTime = (state: ParserState): Time => {
  const hours = parseNumber(state);
  whitespace(state);
  expect(state, ":");
  whitespace(state);
  const minutes = parseNumber(state);
  whitespace(state);
  if (state.input[state.pos] !== ":") {
    return { hours: 0, minutes: hours, seconds: minutes };
  }
  state.inc();
  whitespace(state);
  const seconds = parseNumber(state);
  return { hours, minutes, seconds };
};

const parseBodyweight = (state: ParserState): "bw" => {
  if (state.input.slice(state.pos, state.pos + 2).toLowerCase() !== "bw") {
    error(state, `Expected bw, got ${state.input[state.pos]}`);
  }
  state.inc(2);
  return "bw";
};

const parseWeight = parseNumber;

const parseTag = (state: ParserState): Tag[] => {
  expect(state, "{");

  const tags = [];
  whitespace(state);
  do {
    whitespace(state);
    const key = parseIdentifier(state);
    whitespace(state);
    if (state.input[state.pos] === ":") {
      state.inc();
      whitespace(state);
      const value = /^[\d-.]$/.test(state.input[state.pos])
        ? parseNumber(state)
        : parseIdentifier(state);
      tags.push({ key, value });
      whitespace(state);
    } else {
      tags.push({ key });
    }
  } while (parseComma(state));

  if (state.input[state.pos] !== "}") {
    error(state, `Expected , or }, got ${state.input[state.pos]}`);
  }
  state.inc();
  return tags;
};

const parseComma = (state: ParserState): boolean => {
  if (state.input[state.pos] === ",") {
    state.inc();
    return true;
  }
  return false;
};

export const parseSet = (state: ParserState): Set => {
  const set: Set = {};
  const setSet = <K extends keyof Set>(key: K, value: Set[K]) => {
    if (set[key] !== undefined) {
      error(state, `Duplicate ${key}`);
    }
    set[key] = value;
  };

  whitespace(state);
  while (true) {
    const char = state.input[state.pos];
    if (char === "x") setSet("reps", parseReps(state));
    else if (char === "@") setSet("rpe", parseRpe(state));
    else if (char === "b" || char === "B") {
      setSet("weight", parseBodyweight(state));
    } else if (char === "{") {
      setSet("tags", parseTag(state));
    } else if (/^[0-9.-]$/.test(char)) {
      const rollback = state.save();
      if (isNaN(parseNumber(state))) {
        error(state, `Expected number, got ${state.input[state.pos]}`);
      }

      whitespace(state);
      if (state.input[state.pos] === ":") {
        rollback();
        setSet("time", parseTime(state));
      } else if (/^[mfickl]$/i.test(state.input[state.pos])) {
        rollback();
        const value = parseWithUnit(state);
        if (isWeightValueWithUnit(value)) {
          setSet("weight", value);
        } else if (isDistanceValueWithUnit(value)) {
          setSet("distance", value);
        } else {
          error(state, `Expected weight or distance, got ${value.unit}`);
        }
      } else {
        rollback();
        setSet("weight", parseWeight(state));
      }
    } else {
      break;
    }
    whitespace(state);
  }
  return set;
};
