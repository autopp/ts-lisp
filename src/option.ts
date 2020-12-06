import { Result, Ok, Err } from "./result"

export type Option<T> = Result<T, void>

export class Some<T> extends Ok<T, void> {
  toString(): string {
    return `Some${this.value}`
  }
}

export class None<T> extends Err<T, void> {
  toString(): string {
    return "None"
  }
}
