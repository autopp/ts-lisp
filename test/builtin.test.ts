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
  BuiltinFunc,
  SpForm,
  formatSExpr,
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

type Invoke = ((args: SExprLike[], env?: Env) => EvalResult) & {
  target: SpForm | BuiltinFunc
}

function describeBuiltin(name: string, f: (invoke: Invoke) => unknown) {
  const builtin = makeBuiltins().find((invokable) => invokable.name === name)

  if (builtin === undefined) {
    throw new Error(`builtin func ${name} is not defined yet`)
  }

  const invoke = (isSpForm(builtin)
    ? (args: SExprLike[], env: Env = emptyEnv()) =>
        invokeSpForm(builtin, args.map(makeSExpr), env)
    : (args: SExprLike[], env: Env = emptyEnv()) =>
        invokeFunc(builtin, args.map(makeSExpr), env)) as Invoke
  invoke.target = builtin
  describe(builtin.name, () => {
    f(invoke)
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function describeCases<T extends any[]>(
  invoke: Invoke,
  table: ([string, SExprLike[], ...T] | [SExprLike[], ...T])[],
  f: (subject: (env?: Env) => EvalResult, ...x: [...T, SExprLike[]]) => unknown
) {
  function makeCase(
    description: string,
    args: SExpr[],
    rest: T
  ): [string, SExpr[], T] {
    const suffix = description === "" ? "" : ` (${description})`
    return [
      `when "${formatSExpr(
        makeSExpr([invoke.target.name, ...args])
      )}"${suffix}`,
      args,
      rest,
    ]
  }
  const tableWithName: [string, SExpr[], T][] = table.map((c) => {
    if (typeof c[0] === "string") {
      const [description, args, ...rest] = c as [string, SExpr[], ...T]
      return makeCase(description, args, rest)
    } else {
      const [args, ...rest] = c as [SExpr[], ...T]
      return makeCase("", args, rest)
    }
  })

  describeEach<[SExpr[], T]>(tableWithName, (args, rest) => {
    f((env?: Env) => invoke(args, env), ...rest, args)
  })
}

describeBuiltin("quote", (invoke) => {
  describeCases<[SExprLike]>(
    invoke,
    [
      ["primitive value", [42], 42],
      ["undefined symbol", ["unknown"], "unknown"],
      [[[1, 2, 3]], [1, 2, 3]],
    ],
    (subject, expected) => {
      it("returns the given value", () => {
        expect(subject()).toEqual(new Ok(makeSExpr(expected)))
      })
    }
  )
})

describeBuiltin("cons", (invoke) => {
  describeCases<[SExprLike]>(
    invoke,
    [[[1, 2], cons(1, 2)]],
    (subject, expected) => {
      it("returns new cons cell", () => {
        expect(subject()).toEqual(new Ok(makeSExpr(expected)))
      })
    }
  )
})

describeBuiltin("car", (invoke) => {
  describeCases<[SExprLike]>(
    invoke,
    [[[cons(1, 2)], 1]],
    (subject, expected) => {
      it("returns car of cons cell", () => {
        expect(subject()).toEqual(new Ok(makeSExpr(expected)))
      })
    }
  )
})

describeBuiltin("cdr", (invoke) => {
  describeCases<[SExprLike]>(
    invoke,
    [[[cons(1, 2)], 2]],
    (subject, expected) => {
      it("returns ccdr of cons cell", () => {
        expect(subject()).toEqual(new Ok(makeSExpr(expected)))
      })
    }
  )
})

describeBuiltin("not", (invoke) => {
  describeCases<[SExpr]>(
    invoke,
    [
      [[NIL], TRUE],
      [[FALSE], TRUE],
      [[TRUE], FALSE],
      [[makeNum(0)], FALSE],
      [[makeSym("x")], FALSE],
      [[makeCons(FALSE, FALSE)], FALSE],
    ],
    (subject, expected) => {
      it(`returns ${expected}`, () => {
        expect(subject()).toEqual(new Ok(expected))
      })
    }
  )
})

describeBuiltin("and", (invoke) => {
  describeCases<[EvalResult]>(
    invoke,
    [
      [[], new Ok(TRUE)],
      [[true, true], new Ok(TRUE)],
      [[true, false], new Ok(FALSE)],
      [[null, "unknown"], new Ok(FALSE)],
      [["unknown", true], new Err("unknown is not defined")],
    ],
    (subject, expected) => {
      it(`returns ${expected}`, () => {
        expect(subject()).toEqual(expected)
      })
    }
  )
})

describeBuiltin("or", (invoke) => {
  describeCases<[EvalResult]>(
    invoke,
    [
      [[], new Ok(FALSE)],
      [[false, false], new Ok(FALSE)],
      [[false, true], new Ok(TRUE)],
      [[1, "unknown"], new Ok(TRUE)],
      [[false, "unknown"], new Err("unknown is not defined")],
    ],
    (subject, expected) => {
      it(`returns ${expected}`, () => {
        expect(subject()).toEqual(expected)
      })
    }
  )
})

describeBuiltin("eq?", (invoke) => {
  const c = cons(1, 2)
  describeCases<[boolean]>(
    invoke,
    [
      [[true, false], false],
      [[true, true], true],
      [[false, false], true],
      [[1, 2], false],
      [[1, 1], true],
      [["x", "y"], false],
      [["x", "x"], true],
      ["different cons cells", [cons(1, 2), cons(1, 2)], false],
      ["same cons cells", [c, c], true],
    ],
    (subject, expected) => {
      it(`returns ${expected}`, () => {
        expect(subject()).toEqual(new Ok(makeBool(expected)))
      })
    }
  )
})

describeBuiltin("equal?", (invoke) => {
  describeCases<[boolean]>(
    invoke,
    [
      [[true, false], false],
      [[true, true], true],
      [[false, false], true],
      [[1, 2], false],
      [[1, 1], true],
      [["x", "y"], false],
      [["x", "x"], true],
      [[cons(1, 2), cons(1, 3)], false],
      [[cons(1, 2), cons(1, 2)], true],
      [[cons(1, cons(2, 3)), cons(1, cons(2, 3))], true],
    ],
    (subject, expected) => {
      it(`returns ${expected}`, () => {
        expect(subject()).toEqual(new Ok(makeBool(expected)))
      })
    }
  )
})

describeBuiltin("atom?", (invoke) => {
  describeCases<[boolean]>(
    invoke,
    [
      [[NIL], true],
      [[FALSE], true],
      [[0], true],
      [["x"], true],
      [[cons(1, 2)], false],
      [[invoke.target], false],
    ],
    (subject, expected) => {
      it(`returns ${{ expected }}`, () => {
        expect(subject()).toEqual(new Ok(makeBool(expected)))
      })
    }
  )
})
