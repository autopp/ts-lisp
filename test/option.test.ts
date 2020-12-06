import { Option, Some, None } from "@/option"
import { Err, Ok, Result } from "@/result"
import { describeEach } from "./helper"

describe("Option", () => {
  describe(".okOr", () => {
    describeEach<[Option<number>, Result<number, string>]>(
      "on %s",
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
})
