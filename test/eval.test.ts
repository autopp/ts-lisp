import { Env } from "@/env"
import { evalSExpr } from "@/eval"
import { NIL, TRUE, FALSE, makeNum, makeSym, makeCons, SExpr } from "@/sexpr"
import { describeEach } from "./helper"

describe("evalSExpr", () => {
  describeEach<[SExpr, string, SExpr]>(
    [
      ["with ()", NIL, "()", NIL],
      ["with #t", TRUE, "#t", TRUE],
      ["with #f", FALSE, "#f", FALSE],
      ["with 42", makeNum(42), "42", makeNum(42)],
    ],
    (sexpr, expectedString, expected) => {
      const env = new Env([], null)

      it(`returns ${expectedString}`, () => {
        expect(evalSExpr(sexpr, env)).toEqual(expected)
      })
    }
  )
})
