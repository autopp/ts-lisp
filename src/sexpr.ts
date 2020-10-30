export type Nil = {
  readonly type: "nil"
}

export type Num = {
  readonly type: "number"
  readonly value: number
}

export type Bool = {
  readonly type: "boolean"
  readonly value: boolean
}

export type Sym = {
  readonly type: "symbol"
  readonly value: string
}

export type Cons = {
  readonly type: "cons"
  car: SExpr
  cdr: SExpr
}

export type SExpr = Nil | Num | Bool | Sym | Cons

export const NIL: SExpr = { type: "nil" }
export const TRUE: SExpr = { type: "boolean", value: true }
export const FALSE: SExpr = { type: "boolean", value: false }
