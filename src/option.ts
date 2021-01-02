import { Err, Ok, Result } from "./result"

export type Option<T> = Some<T> | None<T>

interface OptionInterface<T> {
  isDefined(this: Option<T>): this is Some<T>
  filter(f: (x: T) => boolean): Option<T>
  map<R>(f: (x: T) => R): Option<R>
  flatMap<R>(f: (x: T) => Option<R>): Option<R>
  okOr<E>(e: E): Result<T, E>
}

export class Some<T> implements OptionInterface<T> {
  private kind = "some"
  readonly value: T

  constructor(value: T) {
    this.value = value
  }

  isDefined(this: Option<T>): this is Some<T> {
    return true
  }

  filter(f: (x: T) => boolean): Option<T> {
    return f(this.value) ? this : new None()
  }

  map<R>(f: (x: T) => R): Option<R> {
    return new Some(f(this.value))
  }

  flatMap<R>(f: (x: T) => Option<R>): Option<R> {
    return f(this.value)
  }

  okOr<E>(_e: E): Result<T, E> {
    return new Ok(this.value)
  }

  toString(): string {
    return `Some(${this.value})`
  }
}

export class None<T> implements OptionInterface<T> {
  private kind = "none"

  isDefined(this: Option<T>): this is Some<T> {
    return false
  }

  filter(_f: (x: T) => boolean): Option<T> {
    return this
  }

  map<R>(_f: (x: T) => R): Option<R> {
    return (this as unknown) as Option<R>
  }

  flatMap<R>(_f: (x: T) => Option<R>): Option<R> {
    return (this as unknown) as Option<R>
  }

  okOr<E>(e: E): Result<T, E> {
    return new Err(e)
  }

  toString(): string {
    return "None"
  }
}
