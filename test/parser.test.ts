import { EOI_TOKEN, parseProgram, ParserError, tokenize } from "@/parser"
import {
  FALSE,
  makeCons,
  makeList,
  makeNum,
  makeSym,
  NIL,
  SExpr,
  TRUE,
} from "@/sexpr"
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

describe("parseProgram()", () => {
  describeEach<[string, string, SExpr[]]>(
    "with %j",
    [
      ["()", "a nil", [NIL]],
      ["#t", "a true", [TRUE]],
      ["#f", "a false", [FALSE]],
      ["42", "a number", [makeNum(42)]],
      ["answer", "a symbol", [makeSym("answer")]],
      ["(1)", "a list with 1 item", [makeList(makeNum(1))]],
      [
        "(1 2 3)",
        "a list with 3 item",
        [makeList(makeNum(1), makeNum(2), makeNum(3))],
      ],
      [
        "(1 2 . 3)",
        "a nested cons",
        [makeCons(makeNum(1), makeCons(makeNum(2), makeNum(3)))],
      ],
      [
        "((1 2) (3 . 4))",
        "a nested list ",
        [
          makeList(
            makeList(makeNum(1), makeNum(2)),
            makeCons(makeNum(3), makeNum(4))
          ),
        ],
      ],
    ],
    (source, name, expected) => {
      it(`returns ${name}`, () => {
        expect(parseProgram(source)).toEqual(expected)
      })
    }
  )
})
