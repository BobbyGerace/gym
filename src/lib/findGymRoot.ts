import path from "path";
import fs from "fs";
import { getConfig } from "./config";

// Try to find the root of the gym directory
// by traversing up the directory tree until
// a gym.db file is found.
export const cdToGymRoot = (): boolean => {
  let dir = process.cwd();
  while (!isGymRoot(dir)) {
    const parent = path.dirname(dir);
    if (parent === dir) {
      return false;
    }
    dir = parent;
  }
  process.chdir(dir);
  return true;
};

const isGymRoot = (dir: string): boolean => {
  const dbPath = getConfig(true).databaseFile;
  return fs.existsSync(path.join(dir, dbPath));
};
