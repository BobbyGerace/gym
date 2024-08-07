import fs from "fs";
import path from "path";

export type Config = {
  databaseFile: string;
  editor: string;
  editorArgs: string[];
  workoutDir: string;
  unitSystem: "imperial" | "metric";
  e1rmFormula: "brzycki" | "epley";
  afterSaveGitAction: "commit" | "commit-push" | "none";
  locale: string;
};

export const defaultConfig: Config = {
  databaseFile: "./.gym.db",
  editor: "nvim",
  editorArgs: [],
  workoutDir: "./workouts",
  unitSystem: "imperial",
  e1rmFormula: "brzycki",
  afterSaveGitAction: "none",
  locale: "en-US",
};

export const testConfig: Config = {
  ...defaultConfig,
  databaseFile: ":memory:",
};

let cachedConfig: Config | null = null;

// Gets the file './gymconfig.json' in the current directory
// and parses it as JSON, merging it with the default config.
export const getConfig = (noCache = false): Config => {
  if (!noCache && cachedConfig) return cachedConfig;

  const configPath = path.join(process.cwd(), "gymconfig.json");
  let config: Config = defaultConfig;
  if (fs.existsSync(configPath)) {
    const fileConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    config = { ...defaultConfig, ...fileConfig };
  }
  cachedConfig = config;
  return config;
};
