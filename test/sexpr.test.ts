import {
  NIL,
  TRUE,
  FALSE,
  SExpr,
  Bool,
  makeNum,
  makeSym,
  makeCons,
  toBool,
} from "@/sexpr"
import { describeEach } from "./helper"

describe("toBool", () => {
  describeEach<[SExpr, Bool]>(
    [
      ["with nil", NIL, FALSE],
      ["with false", FALSE, FALSE],
      ["with true", TRUE, TRUE],
      ["with number", makeNum(0), TRUE],
      ["with symbol", makeSym("x"), TRUE],
      ["with cons", makeCons(FALSE, FALSE), TRUE],
    ],
    (sexpr, expected) => {
      it(`returns ${expected}`, () => {
        expect(toBool(sexpr)).toBe(expected)
      })
    }
  )
})
