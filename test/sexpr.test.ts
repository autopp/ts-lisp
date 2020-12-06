import { None, Some } from "@/option"
import {
  NIL,
  TRUE,
  FALSE,
  SExpr,
  Bool,
  makeNum,
  makeSym,
  makeCons,
  toBool,
  toArray,
  makeList,
} from "@/sexpr"
import { describeEach } from "./helper"

describe("toBool", () => {
  describeEach<[SExpr, Bool]>(
    [
      ["with nil", NIL, FALSE],
      ["with false", FALSE, FALSE],
      ["with true", TRUE, TRUE],
      ["with number", makeNum(0), TRUE],
      ["with symbol", makeSym("x"), TRUE],
      ["with cons", makeCons(FALSE, FALSE), TRUE],
    ],
    (sexpr, expected) => {
      it(`returns ${expected}`, () => {
        expect(toBool(sexpr)).toBe(expected)
      })
    }
  )
})

describe("toArray", () => {
  describeEach<[SExpr, string, ReturnType<typeof toArray>]>(
    [
      [
        "with nil",
        NIL,
        "Some({ list: [], extra: None })",
        new Some({ list: [], extra: new None() }),
      ],
      ["with false", FALSE, "None", new None()],
      ["with true", TRUE, "None", new None()],
      ["with number", makeNum(0), "None", new None()],
      ["with symbol", makeSym("x"), "None", new None()],
      [
        "with (1 2 3)",
        makeList(makeNum(1), makeNum(2), makeNum(3)),
        "Some({ list: [1, 2, 3], extra: None })",
        new Some({
          list: [makeNum(1), makeNum(2), makeNum(3)],
          extra: new None(),
        }),
      ],
      [
        "with (1 2 . 3)",
        makeCons(makeNum(1), makeCons(makeNum(2), makeNum(3))),
        "Some({ list: [1, 2], extra: Some(3) })",
        new Some({
          list: [makeNum(1), makeNum(2)],
          extra: new Some(makeNum(3)),
        }),
      ],
    ],
    (sexpr, expectedDesc, expected) => {
      it(`returns ${expectedDesc}`, () => {
        expect(toArray(sexpr)).toEqual(expected)
      })
    }
  )
})
