export type Set = Partial<{
  weight: number | "bw" | ValueWithUnit<typeof weightUnits[number]>;
  reps: number[];
  rpe: number;
  distance: ValueWithUnit<typeof distanceUnits[number]>;
  time: Time;
  tags: Tag[];
  sets: number;
}>;
export const distanceUnits = ["m", "km", "mi", "ft", "in", "cm"] as const;
export const weightUnits = ["lb", "kg"] as const;
export const setsUnits = ["sets", "set"] as const;
export const allUnits = [
  ...distanceUnits,
  ...weightUnits,
  ...setsUnits,
] as const;

export const isWeightValueWithUnit = (
  value: ValueWithUnit<string>
): value is ValueWithUnit<typeof weightUnits[number]> =>
  weightUnits.includes(value.unit as any);
export const isDistanceValueWithUnit = (
  value: ValueWithUnit<string>
): value is ValueWithUnit<typeof distanceUnits[number]> =>
  distanceUnits.includes(value.unit as any);
export const isSets = (
  value: ValueWithUnit<string>
): value is ValueWithUnit<typeof setsUnits[number]> =>
  setsUnits.includes(value.unit as any);

export type Time = { hours: number; minutes: number; seconds: number };
export type ValueWithUnit<U extends string> = { value: number; unit: U };

// If the shape of this changes, we need to increment the db version
export type Tag = { key: string; value?: string | number };

export type Exercise = {
  name: string;
  sequence: number;
  subsequence: number;
  sets: Set[];
  lineStart: number;
  lineEnd: number;
};

export type FrontMatter = Record<string, string | number | boolean>;

export type Workout = {
  frontMatter: FrontMatter;
  exercises: Exercise[];
};
