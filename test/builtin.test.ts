import { makeBuiltins } from "@/builtin"
import { Env } from "@/env"
import { invokeFunc, EvalResult, invokeSpForm } from "@/eval"
import { Err, Ok } from "@/result"
import {
  makeBool,
  makeCons,
  makeList,
  makeNum,
  makeSym,
  NIL,
  SExpr,
  isSpForm,
  FALSE,
  TRUE,
} from "@/sexpr"
import { describeEach } from "./helper"

type SExprLike = null | boolean | number | string | SExprLike[] | SExpr

function makeSExpr(sexpr: SExprLike): SExpr {
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

function cons(car: SExprLike, cdr: SExprLike): SExpr {
  return makeCons(makeSExpr(car), makeSExpr(cdr))
}

function emptyEnv(): Env {
  return new Env([], null)
}

function describeBuiltin(
  name: string,
  f: (invoke: (args: SExprLike[], env?: Env) => EvalResult) => unknown
) {
  const builtin = makeBuiltins().find((invokable) => invokable.name === name)

  if (builtin === undefined) {
    throw new Error(`builtin func ${name} is not defined yet`)
  }
  if (isSpForm(builtin)) {
    describe(builtin.name, () => {
      f((args: SExprLike[], env: Env = emptyEnv()) =>
        invokeSpForm(builtin, args.map(makeSExpr), env)
      )
    })
  } else {
    describe(builtin.name, () => {
      f((args: SExprLike[], env: Env = emptyEnv()) =>
        invokeFunc(builtin, args.map(makeSExpr), env)
      )
    })
  }
}

describeBuiltin("quote", (invoke) => {
  describeEach<[SExprLike, SExpr]>(
    [
      ["with primitive value 42", 42, makeNum(42)],
      ["with symbol unknown", "unknown", makeSym("unknown")],
      [
        "with list (1 2 3)",
        [1, 2, 3],
        makeList(makeNum(1), makeNum(2), makeNum(3)),
      ],
    ],
    (arg, expected) => {
      it("returns the given value", () => {
        expect(invoke([arg])).toEqual(new Ok(expected))
      })
    }
  )
})

describeBuiltin("cons", (invoke) => {
  it("returns new cons cell", () => {
    expect(invoke([1, 2])).toEqual(new Ok(cons(1, 2)))
  })
})

describeBuiltin("car", (invoke) => {
  it("returns car of cons cell", () => {
    expect(invoke([cons(1, 2)])).toEqual(new Ok(makeNum(1)))
  })
})

describeBuiltin("cdr", (invoke) => {
  it("returns cdr of cons cell", () => {
    expect(invoke([cons(1, 2)])).toEqual(new Ok(makeNum(2)))
  })
})

describeBuiltin("not", (invoke) => {
  describeEach<[SExprLike, SExpr]>(
    [
      ["with nil", NIL, TRUE],
      ["with false", FALSE, TRUE],
      ["with true", TRUE, FALSE],
      ["with number", makeNum(0), FALSE],
      ["with symbol", makeSym("x"), FALSE],
      ["with cons", makeCons(FALSE, FALSE), FALSE],
    ],
    (arg, expected) => {
      it(`returns ${expected}`, () => {
        expect(invoke([arg])).toEqual(new Ok(expected))
      })
    }
  )
})

describeBuiltin("and", (invoke) => {
  describeEach<[SExprLike[], EvalResult]>(
    [
      ["with no args", [], new Ok(TRUE)],
      ["with two true", [true, true], new Ok(TRUE)],
      ["with true and false", [true, false], new Ok(FALSE)],
      ["with falsy and error", [null, "unknown"], new Ok(FALSE)],
      [
        "with error and true",
        ["unknown", true],
        new Err("unknown is not defined"),
      ],
    ],
    (args, expected) => {
      it(`returns ${expected}`, () => {
        expect(invoke(args)).toEqual(expected)
      })
    }
  )
})

describeBuiltin("or", (invoke) => {
  describeEach<[SExprLike[], EvalResult]>(
    [
      ["with no args", [], new Ok(FALSE)],
      ["with two false", [false, false], new Ok(FALSE)],
      ["with false and true", [false, true], new Ok(TRUE)],
      ["with truthy and error", [1, "unknown"], new Ok(TRUE)],
      [
        "with false and error",
        [false, "unknown"],
        new Err("unknown is not defined"),
      ],
    ],
    (args, expected) => {
      it(`returns ${expected}`, () => {
        expect(invoke(args)).toEqual(expected)
      })
    }
  )
})
