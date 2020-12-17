import { makeBuiltinEnv } from "@/builtin"
import { evalSExpr } from "@/eval"
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

describe("cons", () => {
  it("returns new cons cell", () => {
    expect(evalSExpr(makeSExpr(["cons", 1, 2]), makeBuiltinEnv())).toEqual(
      new Ok(makeCons(makeNum(1), makeNum(2)))
    )
  })
})
