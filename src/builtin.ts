import { Env } from "./env"
import { evalSExpr } from "./eval"
import { Err, mapWithResult, Ok, reduceWithResult, Result } from "./result"
import {
  makeBuiltinFunc,
  makeCons,
  isCons,
  SpForm,
  BuiltinFunc,
  UserFunc,
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
  makeNum,
  NIL,
  makeUserFunc,
  toArray,
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
    makeSpForm(
      "if",
      { required: 2, optional: 1 },
      ([condExpr, thenExpr, ...optElse], env) =>
        evalSExpr(condExpr, env).flatMap((cond) => {
          if (toBool(cond)) {
            return evalSExpr(thenExpr, env)
          }

          return optElse.length === 0 ? new Ok(NIL) : evalSExpr(optElse[0], env)
        })
    ),
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
    makeBuiltinFunc("+", { required: 0, hasRest: true }, (sexprs) =>
      reduceWithResult<SExpr, number, string>(
        sexprs,
        (acc, sexpr, i) =>
          isNum(sexpr)
            ? new Ok(acc + sexpr)
            : new Err(`expected numbers, but arg ${i + 1} is not number`),
        0
      ).map(makeNum)
    ),
    makeBuiltinFunc("-", { required: 1, hasRest: true }, ([first, ...rest]) => {
      if (!isNum(first)) {
        return new Err(`expected numbers, but arg 1 is not number`)
      }
      if (rest.length === 0) {
        return new Ok(makeNum(-first))
      }

      return reduceWithResult<SExpr, number, string>(
        rest,
        (acc, sexpr, i) =>
          isNum(sexpr)
            ? new Ok(acc - sexpr)
            : new Err(`expected numbers, but arg ${i + 2} is not number`),
        first
      ).map(makeNum)
    }),
    makeBuiltinFunc("*", { required: 0, hasRest: true }, (sexprs) =>
      reduceWithResult<SExpr, number, string>(
        sexprs,
        (acc, sexpr, i) =>
          isNum(sexpr)
            ? new Ok(acc * sexpr)
            : new Err(`expected numbers, but arg ${i + 1} is not number`),
        1
      ).map(makeNum)
    ),
    makeBuiltinFunc("/", { required: 1, hasRest: true }, ([first, ...rest]) => {
      if (!isNum(first)) {
        return new Err(`expected numbers, but arg 1 is not number`)
      }
      if (rest.length === 0) {
        return new Ok(makeNum(1 / first))
      }

      return reduceWithResult<SExpr, number, string>(
        rest,
        (acc, sexpr, i) =>
          isNum(sexpr)
            ? new Ok(acc / sexpr)
            : new Err(`expected numbers, but arg ${i + 2} is not number`),
        first
      ).map(makeNum)
    }),
    makeSpForm("lambda", { required: 2 }, ([params, body], env) => {
      type RequiredParams = UserFunc["requiredParams"]
      type OptionalParams = UserFunc["optionalParams"]
      type RestParam = UserFunc["restParam"]
      const spec: Result<
        [RequiredParams, OptionalParams, string | undefined],
        string
      > = isSym(params)
        ? new Ok([[], [], params])
        : toArray(params)
            .okOr("expect param list")
            .flatMap(({ list, extra }) => {
              const requiredParams: RequiredParams = []
              let i: number
              for (i = 0; i < list.length; i++) {
                const param = list[i]
                if (!isSym(param)) {
                  break
                }
                requiredParams.push(param)
              }

              return mapWithResult(
                list.slice(i),
                (param, j): Result<OptionalParams[number], string> =>
                  toArray(param)
                    .filter(
                      ({ list, extra }) =>
                        list.length === 2 && !extra.isDefined()
                    )
                    .okOr("parameter list is invalid")
                    .flatMap(({ list: [name, defaultVal] }) =>
                      isSym(name)
                        ? new Ok({ name, defaultVal })
                        : new Err(`parameter ${i + j + 1} is invalid`)
                    )
              ).flatMap((optionalParams) => {
                const shouldRest: Result<RestParam, string> = extra.isDefined()
                  ? isSym(extra.value)
                    ? new Ok(extra.value)
                    : new Err("rest parameter should be a symbol")
                  : new Ok(undefined)
                return shouldRest.map((restParam) => [
                  requiredParams,
                  optionalParams,
                  restParam,
                ])
              })
            })

      return spec.map((params) => makeUserFunc("", ...params, body, env))
    }),
  ]
}
