import { testConfig } from "../lib/config";
import { CalcController } from "./calc";

describe("CalcController", () => {
  let consoleSpy: jest.SpyInstance<void, any>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("e1rm", () => {
    test("calculates the 1RM", async () => {
      const cc = new CalcController(testConfig);
      await cc.e1rm("185x3@8", {});
      expect(consoleSpy).toHaveBeenCalledWith(208.13);
    });

    test("calculates the 1RM with a different formula", async () => {
      const cc = new CalcController(testConfig);
      await cc.e1rm("185x3@8", { formula: "epley" });
      expect(consoleSpy).toHaveBeenCalledWith(215.83);
    });
  });

  describe("convertRpe", () => {
    test("Returns reps when reps is missing", async () => {
      const cc = new CalcController(testConfig);
      await cc.convertRpe("185x8@8", "195@8", {});
      expect(consoleSpy).toHaveBeenCalledWith(6);
    });

    test("Returns weight when weight is missing", async () => {
      const cc = new CalcController(testConfig);
      await cc.convertRpe("185x8@8", "x6@8", {});
      expect(consoleSpy).toHaveBeenCalledWith(198.7);
    });

    test("Returns RPE when RPE is missing", async () => {
      const cc = new CalcController(testConfig);
      await cc.convertRpe("185x8@8", "195x6", {});
      expect(consoleSpy).toHaveBeenCalledWith(7.5);
    });

    // TODO: Test all three epley functions
    // TODO: Test edge cases (rpe > 10, rpe < 0, reps < 0, etc.)
  });
});
