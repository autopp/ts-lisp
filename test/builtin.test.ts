import { makeBuiltins } from "@/builtin"
import { Env } from "@/env"
import { invokeFunc, EvalResult, invokeSpForm } from "@/eval"
import { Ok } from "@/result"
import {
  makeBool,
  makeCons,
  makeList,
  makeNum,
  makeSym,
  NIL,
  SExpr,
  isSpForm,
} from "@/sexpr"
import { describeEach } from "./helper"

type SExprLike = null | boolean | number | string | SExprLike[] | SExpr

function makeSExpr(sexpr: SExprLike): SExpr {
  if (sexpr === null) {
    return NIL
  }
  if (typeof sexpr === "boolean") {
    return makeBool(sexpr)
  }
  if (typeof sexpr === "number") {
    return makeNum(sexpr)
  }
  if (typeof sexpr === "string") {
    return makeSym(sexpr)
  }
  if (Array.isArray(sexpr)) {
    return makeList(...sexpr.map(makeSExpr))
  }

  return sexpr
}

function cons(car: SExprLike, cdr: SExprLike): SExpr {
  return makeCons(makeSExpr(car), makeSExpr(cdr))
}

function emptyEnv(): Env {
  return new Env([], null)
}

function describeBuiltin(
  name: string,
  f: (invoke: (args: SExprLike[], env?: Env) => EvalResult) => unknown
) {
  const builtin = makeBuiltins().find((invokable) => invokable.name === name)

  if (builtin === undefined) {
    throw new Error(`builtin func ${name} is not defined yet`)
  }
  if (isSpForm(builtin)) {
    describe(builtin.name, () => {
      f((args: SExprLike[], env: Env = emptyEnv()) =>
        invokeSpForm(builtin, args.map(makeSExpr), env)
      )
    })
  } else {
    describe(builtin.name, () => {
      f((args: SExprLike[], env: Env = emptyEnv()) =>
        invokeFunc(builtin, args.map(makeSExpr), env)
      )
    })
  }
}

describeBuiltin("quote", (invoke) => {
  describeEach<[SExprLike, SExpr]>(
    [
      ["with primitive value 42", 42, makeNum(42)],
      ["with symbol unknown", "unknown", makeSym("unknown")],
      [
        "with list (1 2 3)",
        [1, 2, 3],
        makeList(makeNum(1), makeNum(2), makeNum(3)),
      ],
    ],
    (arg, expected) => {
      it("returns the given value", () => {
        expect(invoke([arg])).toEqual(new Ok(expected))
      })
    }
  )
})

describeBuiltin("cons", (invoke) => {
  it("returns new cons cell", () => {
    expect(invoke([1, 2])).toEqual(new Ok(cons(1, 2)))
  })
})

describeBuiltin("car", (invoke) => {
  it("returns car of cons cell", () => {
    expect(invoke([cons(1, 2)])).toEqual(new Ok(makeNum(1)))
  })
})

describeBuiltin("cdr", (invoke) => {
  it("returns cdr of cons cell", () => {
    expect(invoke([cons(1, 2)])).toEqual(new Ok(makeNum(2)))
  })
})
