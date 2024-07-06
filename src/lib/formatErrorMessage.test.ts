import { formatErrorMessage } from "./formatErrorMessage";
import { ParseError } from "./parser";

const fileContents = `---
name: Upper Body
date: Fri Sep 22 2023
deload: true
---

# Deadlift
295xEight,8

# SSB Squat
155x10,10,10

# Hanging Leg Raise
BWx10,10,10

& Single Leg Calf Raise
BWx15,15,15
`;

describe("formatErrorMessage", () => {
  const error: ParseError = {
    line: 8,
    col: 5,
    length: 5,
    message: 'Expected a number but got "Eight"',
  };
  const formattedError = `ERROR: Expected a number but got "Eight"

8| 295xEight,8
       ^^^^^
`;

  test("should format the error message", () => {
    expect(formatErrorMessage(error, fileContents)).toBe(formattedError);
  });
});
