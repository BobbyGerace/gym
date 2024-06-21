import { ParserState } from "./parserState";
import {
  takeWhile,
  whitespace,
  expect,
  parseIdentifier,
  parseString,
} from "./util";
import {
  Set,
  Tag,
  Time,
  ValueWithUnit,
  allUnits,
  isDistanceValueWithUnit,
  isSets,
  isWeightValueWithUnit,
} from "./ast";

const unitStartRegex = new RegExp(`^[${allUnits.map((u) => u[0])}]$`, "i");

const parseNumber = (state: ParserState): number => {
  const { line, col } = state;
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
    state.error(`Invalid number ${num}`, line, col, num.length);
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
  const { line, col } = state;
  const unit = takeWhile(state, (char) => /[a-zA-Z]/.test(char)).toLowerCase();
  if (!allUnits.includes(unit as any)) {
    state.error(`Expected unit, got ${unit}`, line, col, unit.length);
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
  const { line, col } = state;
  const nextTwo = state.peek(2);
  if (nextTwo.toLowerCase() !== "bw") {
    state.error(`Expected bw, got ${nextTwo}`, line, col, 2);
  }
  state.inc(2);
  return "bw";
};

const parseWeight = parseNumber;

const parseTag = (state: ParserState): Tag[] => {
  expect(state, "{");

  const tags = [];
  do {
    whitespace(state);
    const key = parseTagKey(state);
    whitespace(state);
    if (state.input[state.pos] === ":") {
      state.inc();
      whitespace(state);
      const value = parseTagValue(state);
      tags.push({ key, value });
    } else {
      tags.push({ key });
    }
    whitespace(state);
  } while (parseComma(state));

  if (state.input[state.pos] !== "}") {
    state.error(`Expected , or }, got ${state.input[state.pos]}`);
    takeWhile(state, (char) => char !== "}" && char !== "\n");
  }
  state.inc();
  return tags;
};

const parseTagKey = (state: ParserState): string => {
  if (state.input[state.pos] === '"') {
    return parseString(state);
  }
  return getIdentifierOrSkip(state);
};

const parseTagValue = (state: ParserState): string | number => {
  if (/^[\d-.]$/.test(state.input[state.pos])) {
    return parseNumber(state);
  }
  if (state.input[state.pos] === '"') {
    return parseString(state);
  }
  return getIdentifierOrSkip(state);
};

// Try to parse an identifier, if it fails, skip to the next part of the tag
const getIdentifierOrSkip = (state: ParserState): string => {
  const { line, col } = state;
  let identifier = parseIdentifier(state);
  if (identifier === null) {
    identifier = takeWhile(state, (char) => !"\n:,} ".includes(char));
    state.error(
      `Expected identifier, got ${state.input[state.pos]}`,
      line,
      col,
      length
    );
  }
  return identifier;
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

  whitespace(state);
  while (!state.isEOF() && state.char() !== "\n") {
    const { line, col } = state;
    const setSet = <K extends keyof Set>(key: K, value: Set[K]) => {
      if (set[key] !== undefined) {
        state.error(`Duplicate ${key}`, line, col, state.col - col);
      }
      set[key] = value;
    };
    const char = state.input[state.pos];
    if (char === "x") setSet("reps", parseReps(state));
    else if (char === "@") setSet("rpe", parseRpe(state));
    else if (char === "b" || char === "B") {
      setSet("weight", parseBodyweight(state));
    } else if (char === "{") {
      setSet("tags", parseTag(state));
    } else if (/^[0-9.-]$/.test(char)) {
      const rollback = state.save();
      parseNumber(state);
      whitespace(state);
      if (state.input[state.pos] === ":") {
        rollback();
        setSet("time", parseTime(state));
      } else if (unitStartRegex.test(state.input[state.pos])) {
        rollback();
        const value = parseWithUnit(state);
        if (isWeightValueWithUnit(value)) {
          setSet("weight", value);
        } else if (isDistanceValueWithUnit(value)) {
          setSet("distance", value);
        } else if (isSets(value)) {
          // lolol
          setSet("sets", value.value);
        } else {
          state.error(
            `Expected weight or distance, got ${value.unit}`,
            state.line,
            state.col - value.unit.length,
            value.unit.length
          );
        }
      } else {
        rollback();
        setSet("weight", parseWeight(state));
      }
    } else if (state.peek() === "\n" || state.peek(2) === "//") {
      break;
    } else {
      state.error(`Expected set property but found ${char}`, line, col);
      takeWhile(
        state,
        (char) => !/[\s\n]/.test(char) && state.peek(2) !== "//"
      );
    }
    whitespace(state);
  }
  return set;
};
