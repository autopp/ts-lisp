import { makeBuiltinFuncs } from "@/builtin"
import { Env } from "@/env"
import { invokeFunc, EvalResult } from "@/eval"
import { Ok } from "@/result"
import {
  makeBool,
  makeCons,
  makeList,
  makeNum,
  makeSym,
  NIL,
  SExpr,
} from "@/sexpr"

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

function describeBuiltinFunc(
  name: string,
  f: (invoke: (args: SExprLike[], env?: Env) => EvalResult) => unknown
) {
  const builtinFunc = makeBuiltinFuncs().find(
    (builtin) => builtin.name === name
  )

  if (builtinFunc === undefined) {
    throw new Error(`builtin func ${name} is not defined yet`)
  }
  describe(builtinFunc.name, () => {
    f((args: SExprLike[], env: Env = emptyEnv()) =>
      invokeFunc(builtinFunc, args.map(makeSExpr), env)
    )
  })
}

describeBuiltinFunc("cons", (invoke) => {
  it("returns new cons cell", () => {
    expect(invoke([1, 2])).toEqual(new Ok(cons(1, 2)))
  })
})

describeBuiltinFunc("car", (invoke) => {
  it("returns car of cons cell", () => {
    expect(invoke([cons(1, 2)])).toEqual(new Ok(makeNum(1)))
  })
})

describeBuiltinFunc("cdr", (invoke) => {
  it("returns cdr of cons cell", () => {
    expect(invoke([cons(1, 2)])).toEqual(new Ok(makeNum(2)))
  })
})
