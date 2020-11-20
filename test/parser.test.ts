import { EOI_TOKEN, ParserError, tokenize } from "@/parser"
import { describeEach } from "./helper"

describe("tokenize()", () => {
  describeEach(
    'with %j"',
    [
      ["", [EOI_TOKEN]],
      [" \n", [EOI_TOKEN]],
      [
        "'(42 -42 answer42 +-*/<=>!?_#t . #f)",
        [
          { type: "quote", text: "'" },
          { type: "lparen", text: "(" },
          { type: "num", text: "42" },
          { type: "num", text: "-42" },
          { type: "sym", text: "answer42" },
          { type: "sym", text: "+-*/<=>!?_" },
          { type: "true", text: "#t" },
          { type: "dot", text: "." },
          { type: "false", text: "#f" },
          { type: "rparen", text: ")" },
          EOI_TOKEN,
        ],
      ],
    ],
    (source, expected) => {
      it(`returns [${expected.map((t) => t.type)}]`, () => {
        expect(tokenize(source)).toEqual(expected)
      })
    }
  )

  describe('with "#" (invalid input)', () => {
    const doTokenize = () => tokenize("#")

    it("throws ParserError contains unrecognized character infomation", () => {
      expect(doTokenize).toThrowWithMessage(
        ParserError,
        'unrecognized character found "#"'
      )
    })
  })
})
