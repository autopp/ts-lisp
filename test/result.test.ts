/* eslint-disable @typescript-eslint/no-explicit-any */
import { Err, Ok, Result, cond } from "@/result"
import { describeEach } from "./helper"

type TestResult = Result<number, string>

const okVal: TestResult = new Ok(42)
const errVal: TestResult = new Err("error")

function describeResultMethod<T extends any[]>(
  name: string,
  okCase: [...T],
  errCase: [...T],
  fn: (result: TestResult, ...args: T) => any
): void

function describeResultMethod(
  name: string,
  okFn: (result: TestResult) => any,
  errFn: (result: TestResult) => any
): void

function describeResultMethod<T extends any[]>(
  name: string,
  ...args:
    | [
        okCase: [...T],
        errCase: [...T],
        f: (result: TestResult, ...args: T) => any
      ]
    | [okF: (result: TestResult) => any, errF: (result: TestResult) => any]
): void {
  describe(name, () => {
    if (args.length === 3) {
      const [okCase, errCase, f] = args
      describeEach(
        "on %s",
        [
          [okVal, ...okCase],
          [errVal, ...errCase],
        ],
        f
      )
    } else {
      const [okF, errF] = args

      describe(`on ${okVal}`, () => okF(okVal))
      describe(`on ${errVal}`, () => errF(errVal))
    }
  })
}

describe("Result", () => {
  it("dosen't equal to the other kind result with same value", () => {
    expect(new Ok<number, number>(1)).not.toEqual(new Err<number, number>(1))
  })

  describeResultMethod(
    ".toString()",
    ["Ok(42)"],
    ["Err(error)"],
    (result, expected) => {
      it(`returns "${expected}"`, () => {
        expect(result.toString()).toEqual(expected)
      })
    }
  )

  describeResultMethod(".isOk()", [true], [false], (result, expected) => {
    it(`returns ${expected}`, () => {
      expect(result.isOk()).toEqual(expected)
    })
  })

  describeResultMethod(".isNg()", [false], [true], (result, expected) => {
    it(`returns ${expected}`, () => {
      expect(result.isErr()).toEqual(expected)
    })
  })

  describeResultMethod(
    ".filter()",
    (ok) => {
      describeEach<[(x: number) => boolean, string, TestResult]>(
        [
          [
            "with function which returns true",
            (x: number) => x % 2 == 0,
            "not even",
            ok,
          ],
          [
            "with function which returns false",
            (x: number) => x % 2 == 1,
            "not odd",
            new Err("not odd"),
          ],
        ],
        (f, errValue, expected) => {
          it(`returns ${expected}`, () => {
            expect(ok.filter(f, errValue)).toEqual(expected)
          })
        }
      )
    },
    (err) => {
      it("returns self always", () => {
        expect(err.filter((n) => n % 2 == 0, "not even")).toEqual(err)
      })
    }
  )

  type MappedResult = Result<string, string>
  describeResultMethod<[MappedResult]>(
    ".map()",
    [new Ok<string, string>("answer is 42")],
    [new Err<string, string>("error")],
    (result, expected) => {
      it(`returns ${expected}`, () => {
        expect(result.map((x) => `answer is ${x}`)).toEqual(expected)
      })
    }
  )

  describeResultMethod(
    ".flatMap()",
    (ok) => {
      describeEach<[(x: number) => MappedResult, MappedResult]>(
        [
          [
            "with function which return Ok",
            (x) =>
              x % 2 == 0 ? new Ok(`answer is ${x}`) : new Err(`not even`),
            new Ok("answer is 42"),
          ],
          [
            "with function which return Err",
            (x) => (x % 2 == 1 ? new Ok(`answer is ${x}`) : new Err(`not odd`)),
            new Err("not odd"),
          ],
        ],
        (f, expected) => {
          it(`returns ${expected}`, () => {
            expect(ok.flatMap(f)).toEqual(expected)
          })
        }
      )
    },
    (err) => {
      it(`returns the same value always`, () => {
        expect(
          err.flatMap((x) =>
            x % 2 == 0 ? new Ok(`answer is ${x}`) : new Err(`not even`)
          )
        ).toEqual(new Err("error"))
      })
    }
  )
})

describe("cond()", () => {
  describeEach<[boolean, Result<number, string>]>(
    'with %j, () => 42, () => "error"',
    [
      [true, new Ok(42)],
      [false, new Err("error")],
    ],
    (c, expected) => {
      it(`returns ${expected}`, () => {
        expect(
          cond(
            c,
            () => 42,
            () => "error"
          )
        ).toEqual(expected)
      })
    }
  )
})
