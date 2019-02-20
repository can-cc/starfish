export interface Parser {
  check(file: string): boolean;
  parse(code: string): ParseResult;
}

export interface ParseResult {
  title: string;
  content: string;
  date?: string;
  type: string;
}
