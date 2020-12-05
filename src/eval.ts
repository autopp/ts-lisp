import { Env } from "./env"
import { Ok, Result } from "./result"
import { isBool, isNil, isNum, SExpr } from "./sexpr"

export type EvalResult = Result<SExpr, string>

export function evalSExpr(sexpr: SExpr, env: Env): EvalResult {
  if (isNil(sexpr) || isBool(sexpr) || isNum(sexpr)) {
    return new Ok(sexpr)
  } else {
    throw new Error("not implemented")
  }
}
