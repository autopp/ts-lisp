import { Env } from "@/env"
import { EvalResult, evalSExpr } from "@/eval"
import { Err, Ok } from "@/result"
import { NIL, TRUE, FALSE, makeNum, makeSym, makeCons, SExpr } from "@/sexpr"
import { describeEach } from "./helper"

describe("evalSExpr", () => {
  describeEach<[SExpr, string, EvalResult]>(
    [
      ["with ()", NIL, "()", new Ok(NIL)],
      ["with #t", TRUE, "#t", new Ok(TRUE)],
      ["with #f", FALSE, "#f", new Ok(FALSE)],
      ["with 42", makeNum(42), "42", new Ok(makeNum(42))],
      [
        "with answer (defined in env)",
        makeSym("answer"),
        "42",
        new Ok(makeNum(42)),
      ],
      [
        "with unknown (not defined in env)",
        makeSym("unknown"),
        "error",
        new Err("unknown is not defined"),
      ],
    ],
    (sexpr, expectedString, expected) => {
      const env = new Env([["answer", makeNum(42)]], null)

      it(`returns ${expectedString}`, () => {
        expect(evalSExpr(sexpr, env)).toEqual(expected)
      })
    }
  )
})
