import { Result, Ok, Err } from "./result"

export type Option<T> = Result<T, void> & OptionInterface<T>
interface OptionInterface<T> {
  isDefined(this: Option<T>): this is Some<T>
  okOr<E>(e: E): Result<T, E>
}

export class Some<T> extends Ok<T, void> implements OptionInterface<T> {
  toString(): string {
    return `Some(${this.value})`
  }

  isDefined(this: Option<T>): this is Some<T> {
    return this.isOk()
  }

  okOr<E>(_e: E): Result<T, E> {
    return new Ok(this.value)
  }
}

export class None<T> extends Err<T, void> implements OptionInterface<T> {
  toString(): string {
    return "None"
  }

  isDefined(this: Option<T>): this is Some<T> {
    return this.isOk()
  }

  okOr<E>(e: E): Result<T, E> {
    return new Err(e)
  }
}
