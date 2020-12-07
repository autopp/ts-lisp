import { Env } from "./env"
import { Err, Ok, Result } from "./result"
import {
  Arity,
  Func,
  isBool,
  isBuiltinFunc,
  isCons,
  isFunc,
  isNil,
  isNum,
  isProc,
  isSpForm,
  isSym,
  SExpr,
  SpForm,
  toArray,
} from "./sexpr"

export type EvalResult = Result<SExpr, string>

export function evalSExpr(sexpr: SExpr, env: Env): EvalResult {
  if (isNil(sexpr) || isBool(sexpr) || isNum(sexpr)) {
    return new Ok(sexpr)
  } else if (isSym(sexpr)) {
    const value = env.lookup(sexpr)
    return value !== undefined
      ? new Ok(value)
      : new Err(`${sexpr} is not defined`)
  } else {
    return toArray(sexpr)
      .filter(({ extra }) => !extra.isDefined())
      .okOr("expected list format")
      .flatMap(({ list }) => {
        const [shouldProc, ...args] = list
        return evalSExpr(shouldProc, env).flatMap((proc) => {
          if (isFunc(proc)) {
            return callFunc(proc, args, env)
          }

          return new Err("expected proc, but got not proc")
        })
      })
  }
}

function callFunc(func: Func, args: SExpr[], env: Env): EvalResult {
  return args
    .reduce<Result<SExpr[], string>>(
      (result, arg) =>
        result.flatMap((list) =>
          evalSExpr(arg, env).map((evaledArg) => {
            list.push(evaledArg)
            return list
          })
        ),
      new Ok(new Array<SExpr>())
    )
    .flatMap((evaledArgs) => validateByArity(evaledArgs, func.arity))
    .flatMap((evaledArgs) => {
      if (isBuiltinFunc(func)) {
        return func.body(evaledArgs, env)
      } else {
        throw new Error("not implemented")
      }
    })
}

function validateByArity(list: SExpr[], arity: Arity): Result<SExpr[], string> {
  const length = list.length

  if (arity.hasRest) {
    return length >= arity.required
      ? new Ok(list)
      : new Err(`expected ${arity.required} or more than, but got ${length}`)
  } else {
    if (arity.optional > 0) {
      const max = arity.required + arity.optional
      return length >= arity.required && length <= max
        ? new Ok(list)
        : new Err(`expected ${arity.required}...${max}, but got ${length}`)
    } else {
      return length === arity.required
        ? new Ok(list)
        : new Err(`expected ${arity.required}, but got ${length}`)
    }
  }
}
