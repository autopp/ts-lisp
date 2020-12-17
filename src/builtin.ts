import { Env } from "./env"
import { Err, Ok } from "./result"
import { Arity, ProcBody, makeBuiltinFunc, makeCons, isCons } from "./sexpr"

export function makeBuiltinEnv(): Env {
  const funcs: [string, Partial<Arity>, ProcBody][] = [
    ["cons", { required: 2 }, ([car, cdr]) => new Ok(makeCons(car, cdr))],
    [
      "car",
      { required: 1 },
      ([cons]) => (isCons(cons) ? new Ok(cons.car) : new Err("expected cons")),
    ],
    [
      "cdr",
      { required: 1 },
      ([cons]) => (isCons(cons) ? new Ok(cons.cdr) : new Err("expected cons")),
    ],
  ]

  return new Env(
    funcs.map(([name, arity, body]) => [
      name,
      makeBuiltinFunc(name, arity, body),
    ]),
    null
  )
}
