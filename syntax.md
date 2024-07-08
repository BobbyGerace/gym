# Gym Syntax

## Front Matter

A gym file may optionally begin with a YAML-like front matter (but it is not actual YAML). This front matter begins and ends with three dashes, and may contain any number of key-value pairs. The values may be strings, numbers or booleans.

```
---
// Strings may be quoted
name: "Bench Day"

// or unquoted.
workout-date: Sat Jul 6 2024

// If the value is a number, it will be parsed as a number.
body_weight: 200

// booleans are also supported
deload: true
---
```

## Exercises

Exercises are defined by a line starting with a `#` followed by the exercise name. The exercise name is case-insensitive and may contain spaces. Below the exercise is a list of sets.

You may indicate that an exercise is supersetted with the previous exercise by beginning the line with `&` instead of `#`.

```
# Deadlift
405x5

# Bench Press
225x5,5,5

& Chin up
BWx5,5,5

& Lateral Raise
20x10,10,10
```

In the above example, Bench Press, Chin up, and Lateral Raise are all supersetted with each other.

## Sets

Each line following an exercise definition is a set. A set allows you to log any combination of the following elements. The elements can be in any order, and whitespace is ignored.

- Weight
- Reps
- RPE
- Time
- Distance
- Tags (arbitrary metadata)
- Sets (to indicate repeated sets)

### Weight

Weight is a number followed by an optional unit. The unit may be `lb` or `kg`. If none is provided, the default will depend on the unit system set in the configuration.

You may also use `BW` to indicate body weight (equivalent to 0).

### Reps

The syntax for reps is an `x` followed by a number. For repeat sets, you may add additional numbers separated by commas. Note that this will repeat all other elements of the set as well.

```
// This
225x5,6,7 @8

// is equivalent to
225x5 @8
225x6 @8
225x7 @8
```

### RPE

RPE is indicated by an `@` followed by a number. This number may be a decimal.

### Time

Time may be logged as `HH:MM:SS` or `MM:SS`. If only minutes and seconds are provided, the hours will be assumed to be zero.

### Distance

Distance is indicated by a number followed by a unit. The unit may be `mi`, `km`, `m`, `ft`, `cm`, or `in`.

### Tags

Tags are arbitrary metadata that may be logged with a set. They are key-value pairs inside a pair of curly braces. The key and value are separated by a colon. Similar to the front matter, the value may be a string, number, or boolean. Strings that only contain letters, numbers, dashes, and underscores may be unquoted.

If the key does not have a value, it will be assumed to be `true`.

Multiple tags may be logged by separating them with commas.

Examples:

```
# Bench Press with Chains
225x5 @8 { chains: 40 }

# Band Pull Aparts
x20 { band: light }

# Deadlift
405x5 @8 { belt, chalk } // Belt and chalk are both true
```

### Sets

You may indicate that a set is repeated by adding a number followed by `sets`. This is also usedful for logging sets that have no other elements.

Keep in mind that repeating sets can stack with repeating reps syntax.

Examples:

```
// This
225x5,4,3 3 sets

// is equivalent to
225x5
225x4
225x3
225x5
225x4
225x3
225x5
225x4
225x3

// Sometimes you may want to log a set with no other elements
# Hill Sprint
10 sets
```

## Comments

Comments are lines that begin with `//`. They may be placed anywhere in the file.

## Example

Putting it all together, here is a full example workout file:

```
---
name: Lower Body
date: Sat Jul 6 2024
deload: false
---

# Squat
405x1 @8
315x5,5,5

# Dynamic Effort Deadlift
// These felt pretty easy, go up next time
225x3 8 sets { EMOM, chains: 80 }

# Standing Single Leg Calf Raise
BWx20,20,20

& Band Pull Aparts
x30,28,25 { band: light }

# Treadmill Run
2mi 15:00
```
