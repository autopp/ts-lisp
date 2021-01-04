import { Env } from "@/env"
import { EvalResult, evalSExpr } from "@/eval"
import { Err, Ok } from "@/result"
import {
  NIL,
  TRUE,
  FALSE,
  makeNum,
  makeSym,
  makeBuiltinFunc,
  isNum,
  makeList,
  makeUserFunc,
  makeCons,
  makeSpForm,
} from "@/sexpr"
import { describeEach, makeSExpr, SExprLike } from "./helper"

describe("evalSExpr", () => {
  describeEach<[SExprLike, string, EvalResult]>(
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
        "with (if-zero 0 42)",
        makeList(makeSym("if-zero"), makeNum(0), makeNum(42)),
        "42",
        new Ok(makeNum(42)),
      ],
      [
        "with (if-zero 1 unknown)",
        makeList(makeSym("if-zero"), makeNum(1), makeSym("unknown")),
        "()",
        new Ok(NIL),
      ],
      [
        "with (if-zero 0 unknown)",
        makeList(makeSym("if-zero"), makeNum(0), makeSym("unknown")),
        "error",
        new Err("unknown is not defined"),
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
        "with (list2more 1 2)",
        makeList(makeSym("list2more"), makeNum(1), makeNum(2)),
        "(1 2)",
        new Ok(makeList(makeNum(1), makeNum(2))),
      ],
      [
        "with (list2more 1 2 3)",
        makeList(makeSym("list2more"), makeNum(1), makeNum(2), makeNum(3)),
        "(1 2)",
        new Ok(makeList(makeNum(1), makeNum(2), makeNum(3))),
      ],
      [
        "with (list2more 1)",
        makeList(makeSym("list2more"), makeNum(1)),
        "error",
        new Err("expected 2 or more than, but got 1"),
      ],
      [
        "with (inc 41)",
        makeList(makeSym("inc"), makeNum(41)),
        "42",
        new Ok(makeNum(42)),
      ],
      [
        "with (list1to3 1)",
        ["list1to3", 1],
        "(1 2 3)",
        new Ok(makeSExpr([1, 2, 3])),
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

      const list1to3 = makeUserFunc(
        "list1to3",
        ["x"],
        [
          { name: "y", defaultVal: makeNum(2) },
          { name: "z", defaultVal: makeNum(3) },
        ],
        undefined,
        makeSExpr(["list2more", "x", "y", "z"]),
        new Env([["list2more", list2more]], env)
      )
      env.define("list1to3", list1to3)

      const ifZero = makeSpForm(
        "if-zero",
        { required: 2 },
        ([cond, then], env) =>
          evalSExpr(cond, env).flatMap((evaledCond) =>
            evaledCond === 0 ? evalSExpr(then, env) : new Ok(NIL)
          )
      )
      env.define("if-zero", ifZero)

      it(`returns ${expectedString}`, () => {
        expect(evalSExpr(makeSExpr(sexpr), env)).toEqual(expected)
      })
    }
  )
})
