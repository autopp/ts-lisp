export type Nil = {
  type: "nil"
}

export type Num = {
  type: "number"
  value: number
}

export type Bool = {
  type: "boolean"
  value: boolean
}

export type Sym = {
  type: "symbol"
  value: string
}

export type Cons = {
  type: "cons"
  car: SExpr
  cdr: SExpr
}

export type SExpr = Nil | Num | Bool | Sym | Cons
