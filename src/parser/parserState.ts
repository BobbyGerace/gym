export type ParserState = {
  input: string;
  pos: number;
  line: number;
  col: number;
};

export const newState = (input: string): ParserState => ({
  input,
  pos: 0,
  line: 1,
  col: 1,
});
