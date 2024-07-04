import { ParseError } from "./parser";

export const formatErrorMessage = (
  error: ParseError,
  fileContents: string
): string => {
  const messageLine = "ERROR: " + error.message;
  const linePrefix = `${error.line}| `;
  const line = `${linePrefix}${getLine(fileContents, error.line)}`;
  const pointer = `${" ".repeat(linePrefix.length + error.col - 1)}${"^".repeat(
    error.length
  )}`;

  return `${messageLine}\n\n${line}\n${pointer}\n`;
};

const getLine = (fileContents: string, line: number): string => {
  const lines = fileContents.split("\n");
  return lines[line - 1];
};
