/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Opaque } from "ts-essentials"
import { Env } from "./env"
import { EvalResult } from "./eval"
import { Some, None, Option } from "./option"

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
  type: "cons"
  car: SExpr
  cdr: SExpr
}
export function makeCons(car: SExpr, cdr: SExpr): Cons {
  return { type: "cons", car, cdr }
}
export function isCons(x: SExpr): x is Cons {
  return x && typeof x === "object" && (x as any).type === "cons"
}

export type Arity = {
  required: number
  optional: number
  hasRest: boolean
}
function makeArity(x: Partial<Arity>): Arity {
  return {
    required: x.required || 0,
    optional: x.optional || 0,
    hasRest: !!x.hasRest,
  }
}

export type ProcBody = (args: SExpr[], env: Env) => EvalResult

export type SpForm = {
  type: "spForm"
  name: string
  arity: Arity
  body: ProcBody
}
export function makeSpForm(
  name: string,
  arity: Partial<Arity>,
  body: ProcBody
): SpForm {
  return { type: "spForm", name, arity: makeArity(arity), body }
}
export function isSpForm(x: SExpr): x is SpForm {
  return x && typeof x === "object" && (x as { type: string }).type === "spForm"
}

export type BuiltinFunc = {
  type: "builtin"
  name: string
  arity: Arity
  body: ProcBody
}
export function makeBuiltinFunc(
  name: string,
  arity: Partial<Arity>,
  body: ProcBody
): BuiltinFunc {
  return { type: "builtin", name, arity: makeArity(arity), body }
}
export function isBuiltinFunc(x: SExpr): x is BuiltinFunc {
  return (
    x && typeof x === "object" && (x as { type: string }).type === "builtin"
  )
}

export type UserFunc = {
  type: "lambda"
  name: string
  arity: Arity
  requiredParams: string[]
  optionalParams: { name: string; defaultVal: SExpr }[]
  restParam: string | undefined
  body: SExpr
  env: Env
}
export function makeUserFunc(
  name: string,
  requiredParams: string[],
  optionalParams: { name: string; defaultVal: SExpr }[],
  restParam: string | undefined,
  body: SExpr,
  env: Env
): UserFunc {
  return {
    type: "lambda",
    name,
    arity: {
      required: requiredParams.length,
      optional: optionalParams.length,
      hasRest: restParam !== undefined,
    },
    requiredParams,
    optionalParams,
    restParam,
    body,
    env,
  }
}
export function isUserFunc(x: SExpr): x is UserFunc {
  return x && typeof x === "object" && (x as { type: string }).type === "lambda"
}

export type Func = BuiltinFunc | UserFunc
export function isFunc(x: any): x is Func {
  return isBuiltinFunc(x) || isUserFunc(x)
}

export type Proc = SpForm | Func
export function isProc(x: any): x is Proc {
  return isSpForm(x) || isFunc(x)
}

export type SExpr = Nil | Num | Bool | Sym | Cons | Proc

export function toBool(x: SExpr): Bool {
  return makeBool(!isNil(x) && x !== FALSE)
}

export function makeList(...sexprs: SExpr[]): Cons | Nil {
  return sexprs.reduceRight<Cons | Nil>(
    (cdr, sexpr) => makeCons(sexpr, cdr),
    NIL
  )
}

export function toArray(
  sexpr: SExpr
): Option<{ list: SExpr[]; extra: Option<SExpr> }> {
  function toArrayWith(
    { car, cdr }: Cons,
    list: SExpr[]
  ): ReturnType<typeof toArray> {
    list.push(car)
    if (isCons(cdr)) {
      return toArrayWith(cdr, list)
    }

    return new Some({ list, extra: new Some(cdr).filter((x) => !isNil(x)) })
  }

  if (isNil(sexpr)) {
    return new Some({ list: [], extra: new None() })
  }

  if (isCons(sexpr)) {
    return toArrayWith(sexpr, [])
  }

  return new None()
}

export function formatSExpr(sexpr: SExpr): string {
  return formatSExprWithStack(sexpr, [])
}

function formatSExprWithStack(sexpr: SExpr, stack: Cons[]): string {
  if (isNil(sexpr)) {
    return "()"
  } else if (isBool(sexpr)) {
    return sexpr ? "#t" : "#f"
  } else if ([isNum, isSym].some((pred) => pred(sexpr))) {
    return `${sexpr}`
  } else if (isProc(sexpr)) {
    const label = isSpForm(sexpr)
      ? "special"
      : isBuiltinFunc(sexpr)
      ? "builtin"
      : "lambda"
    return sexpr.name === "" ? `#<${label}>` : `#<${label} ${sexpr.name}>`
  } else if (isCons(sexpr)) {
    return formatCons(sexpr, stack)
  }

  throw new Error(`not implemented formatting ${sexpr}`)
}

function formatCons(cons: Cons, stack: Cons[]): string {
  if (stack.some((visited) => Object.is(visited, cons))) {
    return "(...)"
  }

  stack.push(cons)
  const formatted: string[] = [formatSExprWithStack(cons.car, stack)]
  let rest: SExpr
  for (rest = cons.cdr; isCons(rest); rest = rest.cdr) {
    formatted.push(formatSExprWithStack(rest.car, stack))
  }

  const tail = isNil(rest) ? "" : ` . ${formatSExprWithStack(rest, stack)}`
  stack.pop()

  return `(${formatted.join(" ")}${tail})`
}
