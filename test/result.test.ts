import { Err, Ok, Result } from "@/result"
import { describeEach } from "./helper"

type TestResult = Result<number, string>

function describeResultMethod<T extends any[]>(
  name: string,
  okCase: [...T],
  errCase: [...T],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (result: TestResult, ...args: T) => any
): void

function describeResultMethod(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  okFn: (result: TestResult) => any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errFn: (result: TestResult) => any
): void

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      describeEach<[TestResult, ...T]>(
        "on %s",
        [
          [new Ok<number, string>(42), ...okCase],
          [new Err<number, string>("error"), ...errCase],
        ],
        f
      )
    } else {
      const [okF, errF] = args

      const ok = new Ok<number, string>(42)
      describe(`on ${ok}`, () => okF(ok))

      const err = new Err<number, string>("error")
      describe(`on ${err}`, () => errF(err))
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
})
