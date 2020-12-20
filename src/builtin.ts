import { Env } from "./env"
import { Err, Ok } from "./result"
import { makeBuiltinFunc, makeCons, isCons, BuiltinFunc } from "./sexpr"

export function makeBuiltinEnv(): Env {
  return new Env(
    makeBuiltinFuncs().map((f) => [f.name, f]),
    null
  )
}

export function makeBuiltinFuncs(): BuiltinFunc[] {
  return [
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
  ]
}
