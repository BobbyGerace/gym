type Token =
  | {
      type:
        | "identifier"
        | "string"
        | "newline"
        | "operator"
        | "eof"
        | "front-matter-delimiter";
      value: string;
      line: number;
      col: number;
    }
  | {
      type: "number";
      value: number;
      line: number;
      col: number;
    }
  | {
      type: "error";
      value: string;
      message: string;
      line: number;
      col: number;
    };

export class Lexer {
  input: string;
  private _pos: number;
  private _line: number;
  private _col: number;
  private mode: "front-matter" | "normal" | "tag";
  private lastToken: Token | null = null;

  constructor(input: string) {
    this.input = input;
    this._pos = 0;
    this._line = 1;
    this._col = 1;
    this.mode = "normal";
  }

  get pos(): number {
    return this._pos;
  }

  get line(): number {
    return this._line;
  }

  get col(): number {
    return this._col;
  }

  next() {
    this.whitespace();
    this.comment();

    if (this.mode === "front-matter") {
      return this.nextFrontMatter();
    } else {
      return this.nextNormal();
    }
  }

  private nextNormal() {}

  private nextFrontMatter(): Token {
    const last = this.lastToken;
    if (last?.type === "operator" && last.value === ":") {
      return this.takeUntilLineEnd();
    } else if (this.char() === ":") return this.operator();
    else if (this.char() === "\n") return this.newLine();
    else if (this.char() === "-") {
      return this.frontMatterDelimiter();
      this.mode = "normal";
    } else if (/^[a-zA-Z_]$/.test(this.char())) return this.identifier();
    else
      throw new InvalidToken(
        "Unexpected character " + this.char(),
        this.char()
      );
  }

  save(): () => void {
    const pos = this._pos;
    const line = this._line;
    const col = this._col;
    return () => {
      this._pos = pos;
      this._line = line;
      this._col = col;
    };
  }

  isEOF(): boolean {
    return this._pos >= this.input.length;
  }

  private char() {
    return this.input[this.pos];
  }

  private inc(n = 1): string {
    const result = this.input.slice(this.pos, this.pos + n);
    this._pos += n;
    this._col += n;
    return result;
  }

  private incLine() {
    this._line++;
    this._col = 1;
  }

  private takeWhile(predicate: (char: string) => boolean): string {
    let result = "";

    while (this.pos < this.input.length && predicate(this.input[this.pos])) {
      result += this.input[this.pos];
      this.inc();
    }
    return result;
  }

  private takeUntil(predicate: (char: string) => boolean): string {
    return this.takeWhile((char) => !predicate(char));
  }

  private whitespace(): string {
    return this.takeWhile((char) => /[ \t]/.test(char));
  }

  private comment() {
    if (this.char() === "#") {
      return this.takeUntil((char) => char === "\n");
    }
    return "";
  }

  private newLine(): Token {
    return this.wrapToken("newline", () => {
      let result = "";
      if (this.char() === "\r") result += this.inc();
      if (this.char() === "\n") result += this.inc();
      this.incLine();
      return result;
    });
  }

  private takeUntilLineEnd(): Token {
    return this.wrapToken("string", () => {
      const result = this.takeUntil((char) => "\n\r#".includes(char));
      return result.trim();
    });
  }

  private identifier(): Token {
    return this.wrapToken("identifier", () => {
      const key = this.takeWhile((char) => /[a-zA-Z0-9_-]/.test(char));
      return key;
    });
  }
  private string(): Token {
    return this.wrapToken("string", () => {
      let result = "";
      while (this.pos < this.input.length && !/^["\n]/.test(this.char())) {
        if (this.char() === "\\") {
          this.inc();
          switch (this.char()) {
            case "n":
              result += "\n";
              break;
            case "r":
              result += "\r";
              break;
            case "t":
              result += "\t";
              break;
            case "v":
              result += "\v";
              break;
            case "f":
              result += "\f";
              break;
            case "b":
              result += "\b";
              break;
            case "\\":
              result += "\\";
              break;
            case '"':
              result += '"';
              break;
            default:
              result += this.char();
              break;
          }
        } else {
          result += this.char();
        }
        this.inc();
      }

      return result;
    });
  }

  private number(): Token {
    return this.wrapToken("number", () => {
      let num = "";
      if (this.input[this.pos] === "-") {
        this.inc();
        num += "-";
      }
      num += this.takeWhile((char) => /[0-9]/.test(char));
      if (this.input[this.pos] === ".") {
        this.inc();
        num += ".";
        num += this.takeWhile((char) => /[0-9]/.test(char));
      }

      const result = parseFloat(num);

      if (isNaN(result)) {
        throw new InvalidToken(`Invalid number`, num);
      }
      return result;
    });
  }
  private EOF(): Token {
    return this.wrapToken("eof", () => {
      return "";
    });
  }
  private wrapToken<T extends Token["type"]>(
    type: T,
    fn: () => string | number
  ): Token {
    const line = this.line;
    const col = this.col;
    try {
      const value = fn();
      return {
        type,
        value,
        line,
        col,
      } as Token & { type: T };
    } catch (e) {
      if (e instanceof InvalidToken) {
        return {
          type: "error",
          value: e.value.toString(),
          message: e.message,
          line,
          col,
        } as Token & { type: "error" };
      }
      throw e;
    }
  }

  frontMatterDelimiter(): Token {
    return this.wrapToken("front-matter-delimiter", () => {
      const delimiter = this.takeWhile((char) => char === "-");
      if (delimiter.length < 3) {
        throw new InvalidToken("Expected front matter delimiter", delimiter);
      }

      return delimiter;
    });
  }

  operator(): Token {
    return this.wrapToken("operator", () => {
      return this.inc();
    });
  }
}

export const isValidNumber = (str: string): boolean => {
  return !isNaN(str as any) && !isNaN(parseFloat(str));
};

class InvalidToken extends Error {
  value: string;
  constructor(message: string, invalidTokenValue: string) {
    super(message);
    this.value = invalidTokenValue;
  }
}
