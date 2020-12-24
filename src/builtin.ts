import { Env } from "./env"
import { evalSExpr } from "./eval"
import { Err, Ok } from "./result"
import {
  makeBuiltinFunc,
  makeCons,
  isCons,
  BuiltinFunc,
  SpForm,
  makeSpForm,
  toBool,
  makeBool,
  TRUE,
  FALSE,
} from "./sexpr"

export function makeBuiltinEnv(): Env {
  return new Env(
    makeBuiltins().map((f) => [f.name, f]),
    null
  )
}

export function makeBuiltins(): (SpForm | BuiltinFunc)[] {
  return [
    makeSpForm("quote", { required: 1 }, ([sexpr]) => new Ok(sexpr)),
    makeBuiltinFunc(
      "cons",
      { required: 2 },
      ([car, cdr]) => new Ok(makeCons(car, cdr))
    ),
    makeBuiltinFunc("car", { required: 1 }, ([cons]) =>
      isCons(cons) ? new Ok(cons.car) : new Err("expected cons")
    ),
    makeBuiltinFunc("cdr", { required: 1 }, ([cons]) =>
      isCons(cons) ? new Ok(cons.cdr) : new Err("expected cons")
    ),
    makeBuiltinFunc(
      "not",
      { required: 1 },
      ([sexpr]) => new Ok(makeBool(!toBool(sexpr)))
    ),
    makeSpForm("and", { required: 0, hasRest: true }, (sexprs, env) => {
      for (const sexpr of sexprs) {
        const evaled = evalSExpr(sexpr, env).map(toBool)
        if (evaled.isErr() || evaled.value === FALSE) {
          return evaled
        }
      }

      return new Ok(TRUE)
    }),
    makeSpForm("or", { required: 0, hasRest: true }, (sexprs, env) => {
      for (const sexpr of sexprs) {
        const evaled = evalSExpr(sexpr, env).map(toBool)
        if (evaled.isErr() || evaled.value === TRUE) {
          return evaled
        }
      }

      return new Ok(FALSE)
    }),
    makeBuiltinFunc(
      "eq?",
      { required: 2 },
      ([x, y]) => new Ok(makeBool(Object.is(x, y)))
    ),
  ]
}
