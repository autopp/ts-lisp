import { Env } from "@/env"
import { makeNum, makeSym, NIL } from "@/sexpr"
import { describeEach } from "./helper"

describe(Env, () => {
  describe("lookup", () => {
    describeEach<[string, string, ReturnType<Env["lookup"]>]>(
      [
        [
          "when name is defined in the env",
          "the bound value",
          "answer",
          makeNum(42),
        ],
        [
          "when name is defined in the parent env",
          "the bound value",
          "nil",
          NIL,
        ],
        [
          "when name is defined in both current and parent env",
          "the bound value in current env",
          "language",
          makeSym("typescript"),
        ],
        ["when name is not defined", "undefined", "silver-bullet", undefined],
      ],
      (expectedDescription, name, expected) => {
        let env: Env

        beforeEach(() => {
          const parent = new Env(null)
          parent.define("nil", NIL)
          parent.define("language", makeSym("javascript"))

          env = new Env(parent)
          env.define("answer", makeNum(42))
          env.define("language", makeSym("typescript"))
        })

        it(`returns ${expectedDescription}`, () => {
          expect(env.lookup(name)).toEqual(expected)
        })
      }
    )
  })
})
