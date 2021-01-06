import { makeBuiltins } from "@/builtin"
import { Env } from "@/env"
import { invokeFunc, EvalResult, invokeSpForm } from "@/eval"
import { Err, Ok } from "@/result"
import {
  makeBool,
  makeCons,
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
  isBuiltinFunc,
  isCons,
  isSym,
  makeBuiltinFunc,
  isNum,
  isUserFunc,
  UserFunc,
} from "@/sexpr"
import { cons, describeEach, makeSExpr, SExprLike } from "./helper"

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
    args: SExprLike[],
    rest: T
  ): [string, SExpr[], T] {
    const suffix = description === "" ? "" : ` (${description})`
    const sexprs = args.map(makeSExpr)
    const formatedArgs = sexprs.map((arg) => {
      if (isBuiltinFunc(arg)) {
        return arg.name
      }

      const formatted = formatSExpr(arg)
      return isBuiltinFunc(invoke.target) && (isCons(arg) || isSym(arg))
        ? `'${formatted}`
        : formatted
    })
    return [
      `when "(${[invoke.target.name, ...formatedArgs].join(" ")})"${suffix}`,
      sexprs,
      rest,
    ]
  }

  const tableWithName: [string, SExpr[], T][] = table.map((c) => {
    if (typeof c[0] === "string") {
      const [description, args, ...rest] = c as [string, SExprLike[], ...T]
      return makeCase(description, args, rest)
    } else {
      const [args, ...rest] = c as [SExprLike[], ...T]
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
      it("returns cdr of cons cell", () => {
        expect(subject()).toEqual(new Ok(makeSExpr(expected)))
      })
    }
  )
})

describeBuiltin("list", (invoke) => {
  describeCases<[SExprLike]>(
    invoke,
    [
      [[], null],
      [
        [1, 2, 3],
        [1, 2, 3],
      ],
    ],
    (subject, expected, args) => {
      it(`returns (${args.join(" ")})`, () => {
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

describeBuiltin("if", (invoke) => {
  let env: Env
  beforeEach(() => {
    env = emptyEnv()
    env.define("true", TRUE)
    env.define("false", FALSE)
  })

  describeCases<[EvalResult]>(
    invoke,
    [
      [["true", 1], new Ok(makeNum(1))],
      [["true", 1, 2], new Ok(makeNum(1))],
      [["true", 1, "unknown"], new Ok(makeNum(1))],
      [["false", 1], new Ok(NIL)],
      [["false", 1, 2], new Ok(makeNum(2))],
      [["false", "unknown", 2], new Ok(makeNum(2))],
    ],
    (subject, expected) => {
      it(`returns ${expected}`, () => {
        expect(subject(env)).toEqual(expected)
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
      it(`returns ${expected}`, () => {
        expect(subject()).toEqual(new Ok(makeBool(expected)))
      })
    }
  )
})

describeBuiltin("null?", (invoke) => {
  describeCases<[boolean]>(
    invoke,
    [
      [[NIL], true],
      [[FALSE], false],
      [[0], false],
      [["x"], false],
      [[cons(1, 2)], false],
      [[invoke.target], false],
    ],
    (subject, expected) => {
      it(`returns ${expected}`, () => {
        expect(subject()).toEqual(new Ok(makeBool(expected)))
      })
    }
  )
})

describeBuiltin("bool?", (invoke) => {
  describeCases<[boolean]>(
    invoke,
    [
      [[NIL], false],
      [[FALSE], true],
      [[0], false],
      [["x"], false],
      [[cons(1, 2)], false],
      [[invoke.target], false],
    ],
    (subject, expected) => {
      it(`returns ${expected}`, () => {
        expect(subject()).toEqual(new Ok(makeBool(expected)))
      })
    }
  )
})

describeBuiltin("number?", (invoke) => {
  describeCases<[boolean]>(
    invoke,
    [
      [[NIL], false],
      [[FALSE], false],
      [[0], true],
      [["x"], false],
      [[cons(1, 2)], false],
      [[invoke.target], false],
    ],
    (subject, expected) => {
      it(`returns ${expected}`, () => {
        expect(subject()).toEqual(new Ok(makeBool(expected)))
      })
    }
  )
})

describeBuiltin("symbol?", (invoke) => {
  describeCases<[boolean]>(
    invoke,
    [
      [[NIL], false],
      [[FALSE], false],
      [[0], false],
      [["x"], true],
      [[cons(1, 2)], false],
      [[invoke.target], false],
    ],
    (subject, expected) => {
      it(`returns ${expected}`, () => {
        expect(subject()).toEqual(new Ok(makeBool(expected)))
      })
    }
  )
})

describeBuiltin("cons?", (invoke) => {
  describeCases<[boolean]>(
    invoke,
    [
      [[NIL], false],
      [[FALSE], false],
      [[0], false],
      [["x"], false],
      [[cons(1, 2)], true],
      [[invoke.target], false],
    ],
    (subject, expected) => {
      it(`returns ${expected}`, () => {
        expect(subject()).toEqual(new Ok(makeBool(expected)))
      })
    }
  )
})

describeBuiltin("list?", (invoke) => {
  describeCases<[boolean]>(
    invoke,
    [
      [[NIL], true],
      [[FALSE], false],
      [[0], false],
      [["x"], false],
      [[cons(1, 2)], false],
      [[[1, 2]], true],
      [[invoke.target], false],
    ],
    (subject, expected) => {
      it(`returns ${expected}`, () => {
        expect(subject()).toEqual(new Ok(makeBool(expected)))
      })
    }
  )
})

describeBuiltin("+", (invoke) => {
  describeCases<[EvalResult]>(
    invoke,
    [
      [[], new Ok(makeNum(0))],
      [[42], new Ok(makeNum(42))],
      [[30, 10, 2], new Ok(makeNum(42))],
      [[30, "10", 2], new Err("expected numbers, but arg 2 is not number")],
    ],
    (subject, expected) => {
      it(`returns ${expected}`, () => {
        expect(subject()).toEqual(expected)
      })
    }
  )
})

describeBuiltin("-", (invoke) => {
  describeCases<[EvalResult]>(
    invoke,
    [
      [[42], new Ok(makeNum(-42))],
      [[100, 20, 38], new Ok(makeNum(42))],
      [[300, "-20", 38], new Err("expected numbers, but arg 2 is not number")],
    ],
    (subject, expected) => {
      it(`returns ${expected}`, () => {
        expect(subject()).toEqual(expected)
      })
    }
  )
})

describeBuiltin("*", (invoke) => {
  describeCases<[EvalResult]>(
    invoke,
    [
      [[], new Ok(makeNum(1))],
      [[42], new Ok(makeNum(42))],
      [[2, 3, 7], new Ok(makeNum(42))],
      [[2, "3", 7], new Err("expected numbers, but arg 2 is not number")],
    ],
    (subject, expected) => {
      it(`returns ${expected}`, () => {
        expect(subject()).toEqual(expected)
      })
    }
  )
})

describeBuiltin("/", (invoke) => {
  describeCases<[EvalResult]>(
    invoke,
    [
      [[2], new Ok(makeNum(0.5))],
      [[252, 3, 2], new Ok(makeNum(42))],
      [[253, "3", 2], new Err("expected numbers, but arg 2 is not number")],
    ],
    (subject, expected) => {
      it(`returns ${expected}`, () => {
        expect(subject()).toEqual(expected)
      })
    }
  )
})

describeBuiltin("lambda", (invoke) => {
  function expectResultToBeUserFunc(r: EvalResult): UserFunc {
    expect(r).toEqual(new Ok(expect.toSatisfy(isUserFunc)))
    return (r as Ok<UserFunc, string>).value
  }

  let env: Env
  beforeEach(() => {
    env = emptyEnv()
    env.define("lambda", invoke.target)
    env.define(
      "add",
      makeBuiltinFunc("add", { required: 2 }, ([x, y]) =>
        isNum(x) && isNum(y)
          ? new Ok(makeNum(x + y))
          : new Err("expect 2 numbers")
      )
    )
    env.define(
      "cons",
      makeBuiltinFunc(
        "cons",
        { required: 2 },
        ([car, cdr]) => new Ok(makeCons(car, cdr))
      )
    )
  })

  describeCases<[SExprLike[], SExprLike]>(
    invoke,
    [
      [[["x"], ["add", "x", 2]], [40], 42],
      [
        "call with 40",
        [
          ["x", ["y", 2]],
          ["add", "x", "y"],
        ],
        [40],
        42,
      ],
      [
        "call with 41, 1",
        [
          ["x", ["y", 2]],
          ["add", "x", "y"],
        ],
        [41, 1],
        42,
      ],
      ["call with empty args", ["ls", "ls"], [], []],
      ["call with 3 args", ["ls", "ls"], [1, 2, 3], [1, 2, 3]],
      [
        "call with required args only",
        [cons("first", "rest"), ["cons", "first", "rest"]],
        [1],
        [1],
      ],
      [
        "call with rest args",
        [cons("first", "rest"), ["cons", "first", "rest"]],
        [1, 2, 3],
        [1, 2, 3],
      ],
      ["call with 3 args", ["ls", "ls"], [1, 2, 3], [1, 2, 3]],
    ],
    (subject, args, expected) => {
      it(`create user function with current env`, () => {
        const lambda = expectResultToBeUserFunc(subject(env))
        expect(invokeFunc(lambda, args.map(makeSExpr), env)).toEqual(
          new Ok(makeSExpr(expected))
        )
      })
    }
  )

  describe('with "(lambda (x) (lambda (y) (add x y)))"', () => {
    it(`create user function which returns closure`, () => {
      const lambda = expectResultToBeUserFunc(
        invoke([["x"], ["lambda", ["y"], ["add", "x", "y"]]], env)
      )

      const closure = expectResultToBeUserFunc(
        invokeFunc(lambda, [makeNum(40)], env)
      )

      expect(invokeFunc(closure, [makeNum(2)], env)).toEqual(
        new Ok(makeNum(42))
      )
    })
  })
})

describeBuiltin("define", (invoke) => {
  let env: Env
  beforeEach(() => {
    env = emptyEnv()
    env.define("one", makeNum(1))
    env.define(
      "cons",
      makeBuiltinFunc(
        "cons",
        { required: 2 },
        ([car, cdr]) => new Ok(makeCons(car, cdr))
      )
    )
  })

  describeCases<[SExpr, SExpr]>(
    invoke,
    [[["x", ["cons", "one", 2]], makeSym("x"), cons(1, 2)]],
    (subject, expected, bound, [name]) => {
      it(`binds value and returns given name "${name}"`, () => {
        expect(subject(env)).toEqual(new Ok(expected))
        expect(env.lookup(name as string)).toEqual(bound)
      })
    }
  )
})
