import { ParserState } from "./parserState";
import { takeWhile, whitespace, comment, parseIdentifier } from "./util";

export type Set = Partial<{
  weight: number | "bw";
  reps: number[];
  rpe: number;
  distance: Distance;
  time: Time;
  tags: Tag[];
}>;
const distanceUnits = ["m", "km", "mi", "ft"] as const;

type Time = { hours: number; minutes: number; seconds: number };
type Distance = { value: number; unit: typeof distanceUnits[number] };
type Tag = { key: string; value?: string };

const parseNumber = (state: ParserState): number => {
  let num = "";
  if (state.input[state.pos] === "-") {
    state.pos++;
    num += "-";
  }
  num += takeWhile(state, (char) => /[0-9]/.test(char));
  if (state.input[state.pos] === ".") {
    state.pos++;
    num += ".";
    num += takeWhile(state, (char) => /[0-9]/.test(char));
  }

  const result = parseFloat(num);

  if (isNaN(result)) {
    throw new Error(`Expected number, got ${num}`);
  }
  return result;
};

const parseRpe = (state: ParserState): number => {
  if (state.input[state.pos] !== "@") {
    return NaN;
  }
  state.pos++;
  whitespace(state);
  return parseNumber(state);
};

const parseReps = (state: ParserState): number[] => {
  if (state.input[state.pos] !== "x") {
    throw new Error(`Expected x, got ${state.input[state.pos]}`);
  }
  state.pos++;
  const reps: number[] = [];

  do {
    whitespace(state);
    const rep = parseNumber(state);
    reps.push(rep);
    whitespace(state);
  } while (parseComma(state));
  return reps;
};

const parseDistance = (state: ParserState): Distance => {
  const value = parseNumber(state);
  whitespace(state);
  const unit = takeWhile(state, (char) => /[a-z]/.test(char));
  if (!distanceUnits.includes(unit as any)) {
    throw new Error(`Expected unit, got ${unit}`);
  }
  return { value, unit: unit as Distance["unit"] };
};

const parseTime = (state: ParserState): Time => {
  const hours = parseNumber(state);
  whitespace(state);
  if (state.input[state.pos] !== ":") {
    throw new Error(`Expected :, got ${state.input[state.pos]}`);
  }
  state.pos++;
  whitespace(state);
  const minutes = parseNumber(state);
  whitespace(state);
  if (state.input[state.pos] !== ":") {
    return { hours: 0, minutes: hours, seconds: minutes };
  }
  state.pos++;
  whitespace(state);
  const seconds = parseNumber(state);
  return { hours, minutes, seconds };
};

const parseBodyweight = (state: ParserState): "bw" => {
  if (state.input.slice(state.pos, state.pos + 2) !== "bw") {
    throw new Error(`Expected bw, got ${state.input[state.pos]}`);
  }
  state.pos += 2;
  return "bw";
};

const parseWeight = parseNumber;

const parseTag = (state: ParserState): Tag[] => {
  if (state.input[state.pos] !== "{") {
    throw new Error(`Expected {, got ${state.input[state.pos]}`);
  }
  state.pos++;

  const tags = [];
  whitespace(state);
  do {
    whitespace(state);
    const key = parseIdentifier(state);
    whitespace(state);
    if (state.input[state.pos] === ":") {
      state.pos++;
      whitespace(state);
      const value = parseIdentifier(state);
      tags.push({ key, value });
      whitespace(state);
    } else {
      tags.push({ key });
    }
  } while (parseComma(state));

  if (state.input[state.pos] !== "}") {
    throw new Error(`Expected , or }, got ${state.input[state.pos]}`);
  }
  state.pos++;
  return tags;
};

const parseComma = (state: ParserState): boolean => {
  if (state.input[state.pos] === ",") {
    state.pos++;
    return true;
  }
  return false;
};

export const parseSet = (state: ParserState): Set => {
  const set: Set = {};
  const setSet = <K extends keyof Set>(key: K, value: Set[K]) => {
    if (set[key] !== undefined) {
      throw new Error(`Duplicate ${key}`);
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
      const start = state.pos;
      if (isNaN(parseNumber(state))) {
        throw new Error(`Expected number, got ${state.input[state.pos]}`);
      }

      whitespace(state);
      if (state.input[state.pos] === ":") {
        state.pos = start;
        setSet("time", parseTime(state));
      } else if ("mkf".includes(state.input[state.pos])) {
        state.pos = start;
        setSet("distance", parseDistance(state));
      } else {
        state.pos = start;
        setSet("weight", parseWeight(state));
      }
    } else {
      break;
    }
    whitespace(state);
  }
  return set;
};
