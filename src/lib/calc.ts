export const brzyckiFormulas = {
  max: (weight: number, reps: number) =>
    reps === 1 ? weight : weight * (36 / (37 - reps)),
  weight: (max: number, reps: number) => (max * (37 - reps)) / 36,
  reps: (max: number, weight: number) => 37 - (36 * weight) / max,
};

export const epleyFormulas = {
  max: (weight: number, reps: number) =>
    reps === 1 ? weight : weight * (1 + reps / 30),
  weight: (max: number, reps: number) => max / (1 + reps / 30),
  reps: (max: number, weight: number) => 30 * (weight / max - 1),
};
