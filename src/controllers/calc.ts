import { Config } from "../lib/config";

export class CalcController {
  private config: Config;
  constructor(config: Config) {
    this.config = config;
  }

  // TODO: Add route
  e1rm = async (
    set: string,
    options: { formula?: Config["e1rmFormula"] }
  ) => {};

  // TODO: Add route
  convertRpe = async (
    fromSet: string,
    toSet: string,
    options: { formula?: Config["e1rmFormula"] }
  ) => {};
}
