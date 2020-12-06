/* eslint-disable @typescript-eslint/no-explicit-any */
import { Option, Some, None } from "@/option"
import { Err, Ok, Result } from "@/result"
import { describeEach } from "./helper"

type TestOption = Option<number>

const someVal: TestOption = new Some(42)
const noneVal: TestOption = new None()

function describeOptionMethod<T extends any[]>(
  name: string,
  caseName: string,
  someCase: [...T],
  noneCase: [...T],
  fn: (option: TestOption, ...args: T) => any
): void

function describeOptionMethod(
  name: string,
  someFn: (option: TestOption) => any,
  noneFn: (option: TestOption) => any
): void

function describeOptionMethod<T extends any[]>(
  name: string,
  ...args:
    | [
        caseName: string,
        someCase: [...T],
        noneCase: [...T],
        f: (option: TestOption, ...args: T) => any
      ]
    | [someF: (option: TestOption) => any, someF: (option: TestOption) => any]
): void {
  describe(name, () => {
    if (args.length === 4) {
      const [caseName, someCase, noneCase, f] = args
      describeEach(
        caseName,
        [
          [someVal, ...someCase],
          [noneVal, ...noneCase],
        ],
        f
      )
    } else {
      const [someF, noneF] = args

      describe(`on ${someVal}`, () => someF(someVal))
      describe(`on ${noneVal}`, () => noneF(noneVal))
    }
  })
}

describe("Option", () => {
  describeOptionMethod(
    ".isDefined()",
    "on %s",
    [true],
    [false],
    (option, expected) => {
      it(`returns ${expected}`, () => {
        expect(option.isDefined()).toEqual(expected)
      })
    }
  )

  describeOptionMethod(
    ".filter()",
    (some) => {
      describeEach<[(x: number) => boolean, TestOption]>(
        [
          ["with function which returns true", (x: number) => x % 2 == 0, some],
          [
            "with function which returns false",
            (x: number) => x % 2 == 1,
            new None(),
          ],
        ],
        (f, expected) => {
          it(`returns ${expected}`, () => {
            expect(some.filter(f)).toEqual(expected)
          })
        }
      )
    },
    (none) => {
      it("returns self always", () => {
        expect(none.filter((x) => x % 2 == 0)).toEqual(none)
      })
    }
  )

  type MappedOption = Option<string>
  describeOptionMethod<[MappedOption]>(
    ".map()",
    "on %s with (x) => `answer is ${x}`",
    [new Some("answer is 42")],
    [new None()],
    (option, expected) => {
      it(`returns ${expected}`, () => {
        expect(option.map((x) => `answer is ${x}`)).toEqual(expected)
      })
    }
  )

  describeOptionMethod(
    ".flatMap()",
    (some) => {
      describeEach<[(x: number) => MappedOption, MappedOption]>(
        [
          [
            "with function which return Some",
            (x) => (x % 2 == 0 ? new Some(`answer is ${x}`) : new None()),
            new Some("answer is 42"),
          ],
          [
            "with function which return None",
            (x) => (x % 2 == 1 ? new Some(`answer is ${x}`) : new None()),
            new None(),
          ],
        ],
        (f, expected) => {
          it(`returns ${expected}`, () => {
            expect(some.flatMap(f)).toEqual(expected)
          })
        }
      )
    },
    (none) => {
      it(`returns the same value always`, () => {
        expect(
          none.flatMap((x) =>
            x % 2 == 0 ? new Some(`answer is ${x}`) : new None()
          )
        ).toEqual(new None())
      })
    }
  )

  describeOptionMethod<[Result<number, string>]>(
    ".okOr()",
    'on %s with "error"',
    [new Ok(42)],
    [new Err("error")],
    (option, expected) => {
      it(`returns ${expected}`, () => {
        expect(option.okOr("error")).toEqual(expected)
      })
    }
  )
})
