# Gym

A command line tool and language for logging workouts.

## Installation

1. Clone this repository and cd into it
2. `npm install`
3. `npm run build`
4. `npm install -g .`

## How It Works

Gym is a command line tool for logging workouts. It uses a simple DSL to define workouts as text files, and saves them in a SQLite database. The database can be queried to get information about past workouts, history for exercises, and PRs.

## Usage

### Getting Started

Create a new directory for your project and cd into it. Run `gym init` to create a new gym project.

### Creating New Workouts

Workout files are saved as `.gym` files in the `workouts` directory by default. Rather than creating the files manually, it's recommended that you use the `gym workout new` command. This command will create the file for you and open your editor. Afterwards the file will be saved to the database.

`gym workout new` can also create files from templates, or read from stdin. See `gym workout new --help` for more information.

### Workout Syntax

Workouts are defined using a simple DSL. They may optionally include a YAML-like front matter. Here's an example workout:

```
---
name: Bench Day
date: Sat Jul 6 2024
---

# Bench Press
225x6
185x12,12,12

# Incline Bench Press
135x12,10,8

# Treadmill Run
2mi 15:00
```

Workouts also support supersets, comments, RPE, and arbitrary metadata for sets. See [Syntax](syntax.md) for more information.

### History and PRs

You can view your recent history for a given exercise with `gym exercise history <exerciseName>`.

You can also view your rep PRs for a given exercise with `gym exercise prs <exerciseName>`.

Both of these commands can also output JSON for use in other programs.

### Managing Workouts

`gym` provides a number of commands for managing workouts.

- `gym workout edit` is similar to `gym workout new`, but opens an existing workout file for editing.
- `gym workout rm` removes a workout from the database.
- `gym workout save` saves a workout file to the database without opening an editor.

### Calc

The `gym calc` commands are convenience commands for common calculations related to estimated one rep max.

#### e1rm

`gym calc e1rm <set>` will estimate your one rep max based on a set, using the same syntax as sets from a workout file. For example, `gym calc e1rm 225x6` will estimate your 1RM for a 6 rep set of 225. The formula can be specified with the `--formula` flag, or changed in the config. If RPE is provided it will be taken into account for the calculation.

#### Convert

`gym calc convert <fromSet> <toSet>` can estimate weight, reps, or RPE for a set based on another set, depending on which is left out in the second argument. For example, `gym calc convert 185x8@8 x6@8` will return 198.7, which is the estimated weight for a set of 6 reps at RPE 8 based on a set of 8 reps at 185 and RPE 8.

### Config

Gym uses a JSON config file to store settings. The config file will be automatically created for you when you run `gym init`. The following settings are available:

- `databaseFile`: (string) The path to the SQLite database file. Defaults to `gym.db`.
- `editor`: (string) The command to open your editor. Defaults to `vim`.
- `editorArgs`: (string[]) Arguments to pass to the editor. Defaults to `[]`.
- `workoutDir`: (string) The directory where workout files are saved. Defaults to `workouts`.
- `unitSystem`: ("imperial" | "metric") The unit system to use. Defaults to `imperial`.
- `e1rmFormula`: ("brzycki" | "epley") The formula to use for calculating estimated one rep max. Defaults to `brzycki`.
- `afterSaveGitAction`: ("commit" | "commit-push" | "none") The action to take after saving a workout. Defaults to `none`.;
- `locale`: (string) The locale to use for date formatting. Defaults to `en-US`.

### Database Management

If you use the `gym workout` commands to manage your files, the database should be automatically managed. But if it gets out of sync, you can use `gym db sync` to reconcile the database with the files in the `workouts` directory.

If you want to start fresh, you can use `gym db rebuild` to delete the database and recreate it from the files in the `workouts` directory.
