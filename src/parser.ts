import { cond, Err, Ok, Result } from "./result"
import {
  FALSE,
  makeCons,
  makeList,
  makeNum,
  makeSym,
  NIL,
  SExpr,
  TRUE,
} from "./sexpr"

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

export function tokenize(source: string): Result<Token[], string> {
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
      return new Err(`unrecognized character found "${rest[0]}"`)
    }

    const token = matched.makeToken(matched.text)
    if (token !== undefined) {
      tokens.push(token)
    }

    rest = rest.substring(matched.text.length)
  }

  tokens.push(EOI_TOKEN)

  return new Ok(tokens)
}

export function parseProgram(source: string): Result<SExpr[], string> {
  return tokenize(source).flatMap((tokens) => {
    const scanner = new Scanner(tokens)
    const sexprs: SExpr[] = []
    while (scanner.expect("eoi") === null) {
      const sexpr = parseSExpr(scanner)
      if (sexpr.isErr()) {
        return sexpr.cast<SExpr[]>()
      }
      sexpr.map((value) => {
        sexprs.push(value)
      })
    }

    return new Ok(sexprs)
  })
}

function parseSExpr(scanner: Scanner): Result<SExpr, string> {
  if (scanner.expect("lparen")) {
    return parseAfterLparen(scanner)
  } else if (scanner.expect("quote")) {
    return parseSExpr(scanner).map((quoted) =>
      makeList(makeSym("quote"), quoted)
    )
  } else {
    return parseAtom(scanner)
  }
}

function parseAfterLparen(scanner: Scanner): Result<SExpr, string> {
  if (scanner.expect("rparen")) {
    return new Ok(NIL)
  }

  return parseSExpr(scanner).flatMap((first) => {
    function parseAfterFirst(sexprs: SExpr[]): Result<SExpr[], string> {
      if (scanner.expect("rparen")) {
        sexprs.push(NIL)
        return new Ok(sexprs)
      }

      if (scanner.expect("dot")) {
        return parseSExpr(scanner).flatMap((last) => {
          sexprs.push(last)
          return cond(
            scanner.expect("rparen") !== null,
            () => sexprs,
            () => `expected ), but got ${scanner.peek().type} token`
          )
        })
      }
      return parseSExpr(scanner).flatMap((elem) => {
        sexprs.push(elem)
        return parseAfterFirst(sexprs)
      })
    }

    return parseAfterFirst([first]).map((sexprs) =>
      sexprs.reduceRight((cdr, car) => makeCons(car, cdr))
    )
  })
}

function parseAtom(scanner: Scanner): Result<SExpr, string> {
  const token = scanner.next()
  switch (token.type) {
    case "true":
      return new Ok(TRUE)
    case "false":
      return new Ok(FALSE)
    case "num":
      return new Ok(makeNum(parseInt(token.text)))
    case "sym":
      return new Ok(makeSym(token.text))
    default:
      return new Err(`expected atom, but got ${token.type} token`)
  }
}
