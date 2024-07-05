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
      expect(consoleSpy).toHaveBeenCalledWith("208.13");
    });

    test("calculates the 1RM with a different formula", async () => {
      const cc = new CalcController(testConfig);
      await cc.e1rm("185x3@8", { formula: "epley" });
      expect(consoleSpy).toHaveBeenCalledWith("215.83");
    });
  });

  describe("convertRpe", () => {
    test("Returns reps when reps is missing", async () => {
      const cc = new CalcController(testConfig);
      await cc.convertRpe("185x8@8", "195@8", {});
      expect(consoleSpy).toHaveBeenCalledWith("x6");
    });

    test("Returns weight when weight is missing", async () => {
      const cc = new CalcController(testConfig);
      await cc.convertRpe("185x8@8", "x6@8", {});
      expect(consoleSpy).toHaveBeenCalledWith("198.7");
    });

    test("Returns RPE when RPE is missing", async () => {
      const cc = new CalcController(testConfig);
      await cc.convertRpe("185x8@8", "195x6", {});
      expect(consoleSpy).toHaveBeenCalledWith("@7.5");
    });

    test("Returns reps when reps is missing using epley", async () => {
      const cc = new CalcController(testConfig);
      await cc.convertRpe("185x8@8", "195@8", { formula: "epley" });
      expect(consoleSpy).toHaveBeenCalledWith("x5");
    });

    test("Returns weight when weight is missing using epley", async () => {
      const cc = new CalcController(testConfig);
      await cc.convertRpe("185x8@8", "x6@8", { formula: "epley" });
      expect(consoleSpy).toHaveBeenCalledWith("194.74");
    });

    test("Returns RPE when RPE is missing using epley", async () => {
      const cc = new CalcController(testConfig);
      await cc.convertRpe("185x8@8", "195x6", { formula: "epley" });
      expect(consoleSpy).toHaveBeenCalledWith("@8.5");
    });

    test("Returns zero reps when weight is above max", async () => {
      const cc = new CalcController(testConfig);
      await cc.convertRpe("185x8@8", "300@8", {});
      expect(consoleSpy).toHaveBeenCalledWith("x0");
    });

    test("Returns zero when too many reps", async () => {
      const cc = new CalcController(testConfig);
      await cc.convertRpe("185x8@8", "x300@8", {});
      expect(consoleSpy).toHaveBeenCalledWith("0");
    });

    test("Returns >@10 when weight is above max", async () => {
      const cc = new CalcController(testConfig);
      await cc.convertRpe("185x8@8", "300x3", {});
      expect(consoleSpy).toHaveBeenCalledWith(">@10");
    });
  });
});
