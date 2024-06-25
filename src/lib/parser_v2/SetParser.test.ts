import { SetParser } from "./SetParser";
import { ParserState } from "./parserState";

const newState = (input: string) => new ParserState(input);

const parseSet = (state: ParserState) => new SetParser(state).parse();

describe("SetParser", () => {
  // const set = newState(
  //   `100x2,3,4,5 @10 1:30:00 100m {chains: 123, another} // comment`
  // );

  // test("parseSet should parse set", () => {
  //   expect(parseSet(set)).toEqual({
  //     weight: 100,
  //     reps: [2, 3, 4, 5],
  //     rpe: 10,
  //     time: { hours: 1, minutes: 30, seconds: 0 },
  //     distance: { value: 100, unit: "m" },
  //     tags: [{ key: "chains", value: 123 }, { key: "another" }],
  //   });
  // });

  const setWithBodyweight = newState(`bw x 5 @ 10`);
  test("parseSet should parse bodyweight", () => {
    expect(parseSet(setWithBodyweight)).toEqual({
      weight: "bw",
      reps: [5],
      rpe: 10,
    });
  });

  const setWithBodyweightCapital = newState(`BW x 5 @ 10`);
  test("parseSet should parse bodyweight", () => {
    expect(parseSet(setWithBodyweightCapital)).toEqual({
      weight: "bw",
      reps: [5],
      rpe: 10,
    });
  });

  const setWithRepeatSets = newState(`405x1 10 sets`);
  test("parseSet should parse repeat sets", () => {
    expect(parseSet(setWithRepeatSets)).toEqual({
      weight: 405,
      reps: [1],
      sets: 10,
    });
  });

  const weightUnits = ["lb", "kg"];
  test("parseSet should parse weight units", () => {
    for (const unit of weightUnits.concat(
      weightUnits.map((u) => u.toUpperCase())
    )) {
      const setWithWeightUnits = newState(`250${unit} x 5 @ 10`);
      expect(parseSet(setWithWeightUnits)).toEqual({
        weight: { value: 250, unit: unit.toLowerCase() },
        reps: [5],
        rpe: 10,
      });
    }
  });

  const distanceUnits = ["m", "km", "mi", "ft", "in", "cm"];
  test("parseSet should parse distance units", () => {
    for (const unit of distanceUnits.concat(
      distanceUnits.map((u) => u.toUpperCase())
    )) {
      const setWithDistanceUnits = newState(`250${unit} x 5 @ 10`);
      expect(parseSet(setWithDistanceUnits)).toEqual({
        reps: [5],
        rpe: 10,
        distance: { value: 250, unit: unit.toLowerCase() },
      });
    }
  });

  const setWithShortTime = newState(`1:30 @ 10`);
  test("parseSet should parse short time", () => {
    expect(parseSet(setWithShortTime)).toEqual({
      rpe: 10,
      time: { hours: 0, minutes: 1, seconds: 30 },
    });
  });

  // const setWithWhitespace = newState(
  //   `100 x 2 , 3 , 4 , 5 @ 10 1 : 30 : 00 100 m { chains : 123 , another } // comment`
  // );

  // test("parseSet should parse set with whitespace", () => {
  //   expect(parseSet(setWithWhitespace)).toEqual({
  //     weight: 100,
  //     reps: [2, 3, 4, 5],
  //     rpe: 10,
  //     time: { hours: 1, minutes: 30, seconds: 0 },
  //     distance: { value: 100, unit: "m" },
  //     tags: [{ key: "chains", value: 123 }, { key: "another" }],
  //   });
  // });

  // const lotsOfTags = newState(`100x2 {one: a, two_, with-dash: -42.24}`);
  // test("parseSet should parse lots of tags", () => {
  //   expect(parseSet(lotsOfTags)).toEqual({
  //     weight: 100,
  //     reps: [2],
  //     tags: [
  //       { key: "one", value: "a" },
  //       { key: "two_" },
  //       { key: "with-dash", value: -42.24 },
  //     ],
  //   });
  // });

  // const terms =
  //   `100 x2,3,4,5 @10 1:30:00 100m 3sets {chains:123,another}`.split(" ");
  // const permutations = (terms: string[]): string[][] => {
  //   if (terms.length === 1) {
  //     return [terms];
  //   }
  //   const result: string[][] = [];
  //   for (let i = 0; i < terms.length; i++) {
  //     const term = terms[i];
  //     const rest = [...terms.slice(0, i), ...terms.slice(i + 1)];
  //     const permutationsOfRest = permutations(rest);
  //     for (const permutation of permutationsOfRest) {
  //       result.push([term, ...permutation]);
  //     }
  //   }
  //   return result;
  // };

  // test("parseSet should parse all permutations", () => {
  //   const perms = permutations(terms);
  //   for (const permutation of perms) {
  //     const state = newState(permutation.join(" "));
  //     expect(parseSet(state)).toEqual({
  //       weight: 100,
  //       reps: [2, 3, 4, 5],
  //       rpe: 10,
  //       sets: 3,
  //       time: { hours: 1, minutes: 30, seconds: 0 },
  //       distance: { value: 100, unit: "m" },
  //       tags: [{ key: "chains", value: 123 }, { key: "another" }],
  //     });
  //   }
  // });

  // const setWithQuotedTags = newState(`{one: "a", "two": b}`);
  // test("parseSet should parse quoted tags", () => {
  //   expect(parseSet(setWithQuotedTags)).toEqual({
  //     tags: [
  //       { key: "one", value: "a" },
  //       { key: "two", value: "b" },
  //     ],
  //   });
  // });

  // test("parseSet should error if it encounters an invalid term", () => {
  //   const state = newState("100x3,4,5 potato");
  //   parseSet(state);
  //   expect(state.errors.length).toBe(1);
  // });
});
