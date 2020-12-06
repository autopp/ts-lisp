/* eslint-disable @typescript-eslint/no-explicit-any */
import { Option, Some, None } from "@/option"
import { Err, Ok, Result } from "@/result"
import { describeEach } from "./helper"

type TestOption = Option<number>

const someVal: TestOption = new Some(42)
const noneVal: TestOption = new None()

function describeOptionMethod<T extends any[]>(
  name: string,
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
        someCase: [...T],
        noneCase: [...T],
        f: (option: TestOption, ...args: T) => any
      ]
    | [someF: (option: TestOption) => any, someF: (option: TestOption) => any]
): void {
  describe(name, () => {
    if (args.length === 3) {
      const [someCase, noneCase, f] = args
      describeEach(
        "on %s",
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
  describe(".okOr", () => {
    describeEach<[Option<number>, Result<number, string>]>(
      'on %s with "error"',
      [
        [new Some(42), new Ok(42)],
        [new None(), new Err("error")],
      ],
      (option, expected) => {
        it(`returns ${expected}`, () => {
          expect(option.okOr("error")).toEqual(expected)
        })
      }
    )
  })

  describeOptionMethod(".isDefined()", [true], [false], (option, expected) => {
    it(`returns ${expected}`, () => {
      expect(option.isDefined()).toEqual(expected)
    })
  })
})
