import { testConfig } from "../lib/config";
import { CalcController } from "./calc";

describe("CalcController", () => {
  describe("e1rm", () => {
    test("calculates the 1RM", async () => {
      const cc = new CalcController(testConfig);
      const e1rm = await cc.e1rm("185x8@8", {});
      expect(e1rm).toBe(246.73246199);
    });

    test("calculates the 1RM with a different formula", async () => {
      const cc = new CalcController(testConfig);
      const e1rm = await cc.e1rm("185x8@8", { formula: "epley" });
      expect(e1rm).toBeCloseTo(246.66666667);
    });
  });

  // TODO: Figure out exactly what the input/output of convertRpe should be
});
