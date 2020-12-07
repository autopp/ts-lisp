import { Env } from "@/env"
import { EvalResult, evalSExpr } from "@/eval"
import { Err, Ok } from "@/result"
import {
  NIL,
  TRUE,
  FALSE,
  makeNum,
  makeSym,
  SExpr,
  makeBuiltinFunc,
  isNum,
  makeList,
} from "@/sexpr"
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
      [
        "with (answer 41)",
        makeList(makeSym("answer"), makeNum(41)),
        "error",
        new Err("expected proc, but got not proc"),
      ],
      [
        "with (inc 41)",
        makeList(makeSym("inc"), makeNum(41)),
        "42",
        new Ok(makeNum(42)),
      ],
      [
        "with (inc)",
        makeList(makeSym("inc")),
        "42",
        new Err("expected 1, but got 0"),
      ],
      [
        "with (inc 41 1)",
        makeList(makeSym("inc"), makeNum(41), makeNum(1)),
        "42",
        new Err("expected 1, but got 2"),
      ],
    ],
    (sexpr, expectedString, expected) => {
      const inc = makeBuiltinFunc("inc", { required: 1 }, ([sexpr]) => {
        if (isNum(sexpr)) {
          return new Ok(makeNum(sexpr + 1))
        }
        return new Err("is not number")
      })
      const env = new Env(
        [
          ["inc", inc],
          ["answer", makeNum(42)],
        ],
        null
      )

      it(`returns ${expectedString}`, () => {
        expect(evalSExpr(sexpr, env)).toEqual(expected)
      })
    }
  )
})
