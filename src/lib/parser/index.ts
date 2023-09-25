import { parseDocument } from "./document";
import { Workout } from "./ast";
import { newState } from "./parserState";

export const parseWorkout = (workout: string): Workout => {
  const state = newState(workout);
  return parseDocument(state);
};
