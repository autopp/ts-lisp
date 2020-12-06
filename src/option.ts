import { Result, Ok, Err } from "./result"

export type Option<T> = Result<T, void> & OptionInterface<T>
interface OptionInterface<T> {
  okOr<E>(e: E): Result<T, E>
}

export class Some<T> extends Ok<T, void> implements OptionInterface<T> {
  toString(): string {
    return `Some(${this.value})`
  }

  okOr<E>(_e: E): Result<T, E> {
    return new Ok(this.value)
  }
}

export class None<T> extends Err<T, void> implements OptionInterface<T> {
  toString(): string {
    return "None"
  }

  okOr<E>(e: E): Result<T, E> {
    return new Err(e)
  }
}
