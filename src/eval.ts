import { Env } from "./env"
import { Err, mapWithResult, Ok, Result } from "./result"
import {
  Arity,
  Func,
  isBool,
  isBuiltinFunc,
  isFunc,
  isNil,
  isNum,
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
      .flatMap(({ list: [shouldProc, ...args] }) =>
        evalSExpr(shouldProc, env).flatMap((proc) => {
          if (isSpForm(proc)) {
            return invokeSpForm(proc, args, env)
          }
          if (isFunc(proc)) {
            return callFunc(proc, args, env)
          }

          return new Err("expected proc, but got not proc")
        })
      )
  }
}

export function invokeSpForm(
  spForm: SpForm,
  args: SExpr[],
  env: Env
): EvalResult {
  return validateByArity(args, spForm.arity).flatMap(() =>
    spForm.body(args, env)
  )
}

function callFunc(func: Func, args: SExpr[], env: Env): EvalResult {
  return mapWithResult(args, (arg) =>
    evalSExpr(arg, env)
  ).flatMap((evaledArgs) => invokeFunc(func, evaledArgs, env))
}

export function invokeFunc(func: Func, args: SExpr[], env: Env): EvalResult {
  return validateByArity(args, func.arity).flatMap(() => {
    if (isBuiltinFunc(func)) {
      return func.body(args, env)
    } else {
      const namedArgs: [
        string,
        SExpr
      ][] = func.requiredParams.map((name, i) => [name, args[i]])
      const newEnv = new Env(namedArgs, func.env)
      return evalSExpr(func.body, newEnv)
    }
  })
}

function validateByArity(
  list: SExpr[],
  arity: Arity
): Result<undefined, string> {
  const length = list.length

  if (arity.hasRest) {
    return length >= arity.required
      ? new Ok(undefined)
      : new Err(`expected ${arity.required} or more than, but got ${length}`)
  } else {
    if (arity.optional > 0) {
      const max = arity.required + arity.optional
      return length >= arity.required && length <= max
        ? new Ok(undefined)
        : new Err(`expected ${arity.required}...${max}, but got ${length}`)
    } else {
      return length === arity.required
        ? new Ok(undefined)
        : new Err(`expected ${arity.required}, but got ${length}`)
    }
  }
}
