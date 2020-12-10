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
  makeUserFunc,
  makeCons,
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
        "with (add 41 1)",
        makeList(makeSym("add"), makeNum(41), makeNum(1)),
        "42",
        new Ok(makeNum(42)),
      ],
      [
        "with (add 41)",
        makeList(makeSym("add"), makeNum(41)),
        "42",
        new Err("expected 2, but got 1"),
      ],
      [
        "with (add 41 1 2)",
        makeList(makeSym("add"), makeNum(41), makeNum(1), makeNum(2)),
        "42",
        new Err("expected 2, but got 3"),
      ],
      [
        "with (inc 41)",
        makeList(makeSym("inc"), makeNum(41)),
        "42",
        new Ok(makeNum(42)),
      ],
    ],
    (sexpr, expectedString, expected) => {
      const add = makeBuiltinFunc("add", { required: 2 }, ([left, right]) => {
        if (isNum(left) && isNum(right)) {
          return new Ok(makeNum(left + right))
        }
        return new Err("is not number")
      })
      const cons = makeBuiltinFunc("cons", { required: 2 }, ([car, cdr]) => {
        return new Ok(makeCons(car, cdr))
      })
      const list2more = makeBuiltinFunc(
        "list2more",
        { required: 2, hasRest: true },
        (args) => {
          return new Ok(makeList(...args))
        }
      )
      const env = new Env(
        [
          ["add", add],
          ["answer", makeNum(42)],
          ["cons", cons],
          ["list2more", list2more],
        ],
        null
      )

      const inc = makeUserFunc(
        "inc",
        ["x"],
        [],
        undefined,
        makeList(makeSym("add"), makeSym("one"), makeSym("x")),
        new Env(
          [
            ["add", add],
            ["one", makeNum(1)],
          ],
          env
        )
      )
      env.define("inc", inc)

      it(`returns ${expectedString}`, () => {
        expect(evalSExpr(sexpr, env)).toEqual(expected)
      })
    }
  )
})
