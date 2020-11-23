/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Opaque } from "ts-essentials"

export type Nil = Opaque<null, "Nil">
export const NIL: Nil = null as Nil
export function isNil(x: any): x is Nil {
  return x === null
}

export type Num = Opaque<number, "Num">
export function makeNum(n: number): Num {
  return n as Num
}
export function isNum(x: any): x is Num {
  return typeof x === "number"
}

export type Bool = Opaque<boolean, "Bool">
export function makeBool(b: boolean): Bool {
  return b as Bool
}
export const TRUE: Bool = true as Bool
export const FALSE: Bool = false as Bool
export function isBool(x: any): x is Bool {
  return typeof x === "boolean"
}

export type Sym = Opaque<string, "Sym">
export function makeSym(s: string): Sym {
  return s as Sym
}
export function isSym(x: any): x is Sym {
  return typeof x === "string"
}

export type Cons = {
  car: SExpr
  cdr: SExpr
}
export function makeCons(car: SExpr, cdr: SExpr): Cons {
  return { car, cdr }
}
export function isCons(x: any): x is Cons {
  return (
    x && typeof x === "object" && x.car !== undefined && x.cdr !== undefined
  )
}

export type SExpr = Nil | Num | Bool | Sym | Cons

export function toBool(x: SExpr): Bool {
  return makeBool(!isNil(x) && x !== FALSE)
}

export function makeList(...sexprs: SExpr[]): Cons | Nil {
  return sexprs.reduceRight<Cons | Nil>(
    (cdr, sexpr) => makeCons(sexpr, cdr),
    NIL
  )
}
