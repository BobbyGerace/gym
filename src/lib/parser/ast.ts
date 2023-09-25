export type Set = Partial<{
  weight: number | "bw" | ValueWithUnit<typeof weightUnits[number]>;
  reps: number[];
  rpe: number;
  distance: ValueWithUnit<typeof distanceUnits[number]>;
  time: Time;
  tags: Tag[];
}>;
export const distanceUnits = ["m", "km", "mi", "ft", "in", "cm"] as const;
export const weightUnits = ["lb", "kg"] as const;
export const allUnits = [...distanceUnits, ...weightUnits] as const;

export const isWeightValueWithUnit = (
  value: ValueWithUnit<typeof allUnits[number]>
): value is ValueWithUnit<typeof weightUnits[number]> =>
  weightUnits.includes(value.unit as any);
export const isDistanceValueWithUnit = (
  value: ValueWithUnit<typeof allUnits[number]>
): value is ValueWithUnit<typeof distanceUnits[number]> =>
  distanceUnits.includes(value.unit as any);

export type Time = { hours: number; minutes: number; seconds: number };
export type ValueWithUnit<U extends string> = { value: number; unit: U };

// If the shape of this changes, we need to increment the db version
export type Tag = { key: string; value?: string };

export type Exercise = {
  name: string;
  sequence: number;
  subsequence: string | null;
  sets: Set[];
  lineStart: number;
  lineEnd: number;
};

export type Workout = {
  frontMatter: Record<string, string>;
  exercises: Exercise[];
};
