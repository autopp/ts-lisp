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

export const EOI_TOKEN: Token = { type: "eoi", text: "" }

export class ParserError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export function tokenize(source: string): Token[] {
  const rules: [RegExp, Token["type"] | undefined][] = [
    [/^\s+/, undefined],
    [/^[-+]?\d+/, "num"],
    [/^#t/, "true"],
    [/^#f/, "false"],
    [/^[-+*/_a-zA-Z<=>!?a-zA-Z][-+*/_a-zA-Z<=>!?a-zA-Z0-9]*/, "sym"],
    [/^\(/, "lparen"],
    [/^\)/, "rparen"],
    [/^'/, "quote"],
    [/^\./, "dot"],
  ]

  const tokens: Token[] = []
  let rest = source
  while (rest !== "") {
    let matched: { text: string; type: Token["type"] | undefined } | undefined
    for (const [pattern, type] of rules) {
      const regMatched = pattern.exec(rest)
      if (regMatched !== null) {
        matched = { text: regMatched[0], type }
        break
      }
    }
    if (matched === undefined) {
      throw new ParserError(`unrecognized character found "${rest[0]}"`)
    }

    if (matched.type !== undefined) {
      tokens.push({ type: matched.type, text: matched.text })
    }

    rest = rest.substring(matched.text.length)
  }

  tokens.push(EOI_TOKEN)

  return tokens
}
