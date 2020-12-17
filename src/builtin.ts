import { Env } from "./env"
import { Ok } from "./result"
import { Arity, ProcBody, makeBuiltinFunc, makeCons } from "./sexpr"

export function makeBuiltinEnv(): Env {
  const funcs: [string, Partial<Arity>, ProcBody][] = [
    ["cons", { required: 2 }, ([car, cdr]) => new Ok(makeCons(car, cdr))],
  ]

  return new Env(
    funcs.map(([name, arity, body]) => [
      name,
      makeBuiltinFunc(name, arity, body),
    ]),
    null
  )
}
