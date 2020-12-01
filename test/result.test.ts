import { Err, Ok, Result } from "@/result"
import { describeEach } from "./helper"

type TestResult = Result<number, string>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function describeResultMethod<T extends any[]>(
  name: string,
  okCase: [...T],
  errCase: [...T],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (result: TestResult, ...args: T) => any
): void {
  describe(name, () => {
    describeEach<[TestResult, ...T]>(
      "on %s",
      [
        [new Ok<number, string>(42), ...okCase],
        [new Err<number, string>("error"), ...errCase],
      ],
      fn
    )
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
})
