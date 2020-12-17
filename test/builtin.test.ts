import { makeBuiltinEnv } from "@/builtin"
import { invokeFunc, evalSExpr } from "@/eval"
import { Ok } from "@/result"
import {
  BuiltinFunc,
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

describe("cons", () => {
  it("returns new cons cell", () => {
    expect(evalSExpr(makeSExpr(["cons", 1, 2]), makeBuiltinEnv())).toEqual(
      new Ok(makeCons(makeNum(1), makeNum(2)))
    )
  })
})

describe("car", () => {
  it("returns car of cons cell", () => {
    const env = makeBuiltinEnv()
    const f = makeBuiltinEnv().lookup("car") as BuiltinFunc
    expect(invokeFunc(f, [cons(1, 2)], env)).toEqual(new Ok(makeNum(1)))
  })
})

describe("cdr", () => {
  it("returns cdr of cons cell", () => {
    const env = makeBuiltinEnv()
    const f = makeBuiltinEnv().lookup("cdr") as BuiltinFunc
    expect(invokeFunc(f, [cons(1, 2)], env)).toEqual(new Ok(makeNum(2)))
  })
})
