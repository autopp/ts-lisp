import { FALSE, makeNum, makeSym, NIL, SExpr, TRUE } from "./sexpr"

export type Token = {
  type:
    | "num"
    | "true"
    | "false"
    | "sym"
    | "lparen"
    | "rparen"
    | "quote"
    | "dot"
    | "eoi"
  text: string
}

type TokenType = Token["type"]

export const TRUE_TOKEN: Token = { type: "true", text: "#t" }
export const FALSE_TOKEN: Token = { type: "false", text: "#f" }
export const LPAREN_TOKEN: Token = { type: "lparen", text: "(" }
export const RPAREN_TOKEN: Token = { type: "rparen", text: ")" }
export const QUOTE_TOKEN: Token = { type: "quote", text: "'" }
export const DOT_TOKEN: Token = { type: "dot", text: "." }
export const EOI_TOKEN: Token = { type: "eoi", text: "" }

export function makeNumToken(text: string): Token {
  return { type: "num", text }
}

export function makeSymToken(text: string): Token {
  return { type: "sym", text }
}

export class ParserError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

class Scanner {
  private tokens: ReadonlyArray<Token>
  private cur = 0

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  peek = (): Token => this.tokens[this.cur]
  next = (): Token => this.tokens[this.cur++]
  expect = (type: TokenType): Token | null => {
    const token = this.peek()
    return token.type === type ? this.next() : null
  }
}

export function tokenize(source: string): Token[] {
  const rules: [RegExp, (text: string) => Token | undefined][] = [
    [/^\s+/, () => undefined],
    [/^[-+]?\d+/, makeNumToken],
    [/^#t/, () => TRUE_TOKEN],
    [/^#f/, () => FALSE_TOKEN],
    [/^[-+*/_a-zA-Z<=>!?a-zA-Z][-+*/_a-zA-Z<=>!?a-zA-Z0-9]*/, makeSymToken],
    [/^\(/, () => LPAREN_TOKEN],
    [/^\)/, () => RPAREN_TOKEN],
    [/^'/, () => QUOTE_TOKEN],
    [/^\./, () => DOT_TOKEN],
  ]

  const tokens: Token[] = []
  let rest = source
  while (rest !== "") {
    let matched:
      | { text: string; makeToken: (text: string) => Token | undefined }
      | undefined
    for (const [pattern, makeToken] of rules) {
      const regMatched = pattern.exec(rest)
      if (regMatched !== null) {
        matched = { text: regMatched[0], makeToken }
        break
      }
    }
    if (matched === undefined) {
      throw new ParserError(`unrecognized character found "${rest[0]}"`)
    }

    const token = matched.makeToken(matched.text)
    if (token !== undefined) {
      tokens.push(token)
    }

    rest = rest.substring(matched.text.length)
  }

  tokens.push(EOI_TOKEN)

  return tokens
}

export function parseProgram(source: string): SExpr[] {
  const scanner = new Scanner(tokenize(source))
  const sexprs: SExpr[] = []

  while (scanner.expect("eoi") === null) {
    sexprs.push(parseSExpr(scanner))
  }

  return sexprs
}

function parseSExpr(scanner: Scanner): SExpr {
  if (scanner.expect("lparen")) {
    return parseAfterLparen(scanner)
  } else {
    return parseAtom(scanner)
  }
}

function parseAfterLparen(scanner: Scanner): SExpr {
  if (scanner.expect("rparen")) {
    return NIL
  } else {
    throw new Error("not implemented")
  }
}

function parseAtom(scanner: Scanner): SExpr {
  const token = scanner.next()
  switch (token.type) {
    case "true":
      return TRUE
    case "false":
      return FALSE
    case "num":
      return makeNum(parseInt(token.text))
    case "sym":
      return makeSym(token.text)
    default:
      throw new ParserError(`expected atom, but got ${token.type} token`)
  }
}
