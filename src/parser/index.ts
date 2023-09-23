import { parseDocument, Document } from "./document";
import { newState } from "./parserState";

export const parseWorkout = (workout: string): Document => {
  const state = newState(workout);
  return parseDocument(state);
};
