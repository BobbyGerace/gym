# gym

## Installation

1. Clone this repository and cd into it
2. `npm install`
3. `npm run build`
4. `npm install -g .`

## TODO

- Enable multiple error finding in parser
  - Add .error method to parser class
    - should collect messages and line/col numbers
  - Every instance of error should switch to new method
  - Carefully save the start position of tokens before throwing
  - I wish this was more robust but I'm not about to re-write the whole thing at this point. Maybe one day
