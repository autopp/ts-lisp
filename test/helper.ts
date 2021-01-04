/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  makeBool,
  makeCons,
  makeList,
  makeNum,
  makeSym,
  NIL,
  SExpr,
} from "@/sexpr"

export function describeEach<T extends any[]>(
  table: [string, ...T][],
  fn: (...args: T) => any
): void

export function describeEach<T extends any[]>(
  name: string,
  table: [...T][],
  fn: (...args: T) => any
): void

export function describeEach<T extends any[]>(
  ...args:
    | [table: [string, ...T][], fn: (...args: T) => any]
    | [name: string, table: [...T][], fn: (...args: T) => any]
): void {
  if (args.length === 2) {
    const [table, fn] = args
    describe.each(table)("%s", (_name, ...args: T) => {
      fn(...args)
    })
  } else {
    const [name, table, fn] = args
    describe.each(table)(name, fn)
  }
}

export function itEach<T extends any[]>(
  table: [string, ...T][],
  fn: (...args: T) => any
): void

export function itEach<T extends any[]>(
  name: string,
  table: [...T][],
  fn: (...args: T) => any
): void

export function itEach<T extends any[]>(
  ...args:
    | [table: [string, ...T][], fn: (...args: T) => any]
    | [name: string, table: [...T][], fn: (...args: T) => any]
): void {
  if (args.length === 2) {
    const [table, fn] = args
    it.each(table)("%s", (_name, ...args: T) => {
      fn(...args)
    })
  } else {
    const [name, table, fn] = args
    it.each(table)(name, fn)
  }
}

export type SExprLike = null | boolean | number | string | SExprLike[] | SExpr

export function makeSExpr(sexpr: SExprLike): SExpr {
  if (sexpr === null) {
    return NIL
  }
  if (typeof sexpr === "boolean") {
    return makeBool(sexpr)
  }
  if (typeof sexpr === "number") {
    return makeNum(sexpr)
  }
  if (typeof sexpr === "string") {
    return makeSym(sexpr)
  }
  if (Array.isArray(sexpr)) {
    return makeList(...sexpr.map(makeSExpr))
  }

  return sexpr
}

export function cons(car: SExprLike, cdr: SExprLike): SExpr {
  return makeCons(makeSExpr(car), makeSExpr(cdr))
}
