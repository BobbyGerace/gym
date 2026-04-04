# TODO

## Bugs

- **Double Git Push** (`src/lib/EditFile.ts` ~line 208): An unconditional `git push` runs after the conditional one, causing a push regardless of `afterSaveGitAction` config. Remove the second call.

## Issues

- **Exercise rename is not atomic** (`src/controllers/exercise.ts`): Regex replacement is applied directly to `.gym` files with no rollback if the process fails mid-way. Files could be left partially renamed on crash or disk error.

- **Exercise names not regex-escaped** (`src/controllers/exercise.ts`): The rename command builds a regex from the raw exercise name. Names containing regex special characters (`.`, `*`, `(`, etc.) will misbehave.

- **No schema migration strategy** (`src/lib/database.ts`): Database is hardcoded at version `v1` with no upgrade path. Any schema change requires a manual `gym db rebuild`.

## Minor

- **PR rep range is not configurable** (`src/lib/exercise.ts`): `MAX_REPS_FOR_PRS` is hardcoded to 12. Should be a config option.

- **Unreliable change detection** (`src/lib/findChangedFiles.ts`): Uses `Math.max(atime, mtime, ctime)` — `atime` is often disabled on modern systems and `ctime` changes on permission updates. Use `mtime` only.

- **`toJson.ts` is unnecessary** (`src/lib/toJson.ts`): Two-line module wrapping `JSON.stringify`. Inline at call sites.

- **`-N` flag undocumented** (`gym workout history`): The name filter flag exists in the CLI but is missing from the README.
