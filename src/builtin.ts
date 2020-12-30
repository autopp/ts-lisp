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
  SExpr,
  isAtom,
  isNil,
  isBool,
  isNum,
  isSym,
  isList,
  makeList,
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
      "list",
      { required: 0, hasRest: true },
      (sexprs) => new Ok(makeList(...sexprs))
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
    makeBuiltinFunc("equal?", { required: 2 }, ([x, y]) => {
      function equal(x: SExpr, y: SExpr): boolean {
        return (
          Object.is(x, y) ||
          (isCons(x) && isCons(y) && equal(x.car, y.car) && equal(x.cdr, y.cdr))
        )
      }
      return new Ok(makeBool(equal(x, y)))
    }),
    makeBuiltinFunc(
      "atom?",
      { required: 1 },
      ([sexpr]) => new Ok(makeBool(isAtom(sexpr)))
    ),
    makeBuiltinFunc(
      "null?",
      { required: 1 },
      ([sexpr]) => new Ok(makeBool(isNil(sexpr)))
    ),
    makeBuiltinFunc(
      "bool?",
      { required: 1 },
      ([sexpr]) => new Ok(makeBool(isBool(sexpr)))
    ),
    makeBuiltinFunc(
      "number?",
      { required: 1 },
      ([sexpr]) => new Ok(makeBool(isNum(sexpr)))
    ),
    makeBuiltinFunc(
      "symbol?",
      { required: 1 },
      ([sexpr]) => new Ok(makeBool(isSym(sexpr)))
    ),
    makeBuiltinFunc(
      "cons?",
      { required: 1 },
      ([sexpr]) => new Ok(makeBool(isCons(sexpr)))
    ),
    makeBuiltinFunc(
      "list?",
      { required: 1 },
      ([sexpr]) => new Ok(makeBool(isList(sexpr)))
    ),
  ]
}
