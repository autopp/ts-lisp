export type Result<T, E> = Ok<T, E> | Err<T, E>
interface ResultInterface<T, E> {
  isOk(this: Result<T, E>): this is Ok<T, E>
  isErr(this: Result<T, E>): this is Err<T, E>

  filter(f: (x: T) => boolean, e: E): Result<T, E>
  map<R>(f: (x: T) => R): Result<R, E>
  flatMap<R>(f: (x: T) => Result<R, E>): Result<R, E>
}

export class Ok<T, E> implements ResultInterface<T, E> {
  private readonly kind = "ok"
  private readonly value: T
  constructor(value: T) {
    this.value = value
  }

  toString(): string {
    return `Ok(${this.value})`
  }

  isOk(this: Result<T, E>): this is Ok<T, E> {
    return true
  }

  isErr(this: Result<T, E>): this is Err<T, E> {
    return false
  }

  filter(f: (x: T) => boolean, e: E): Result<T, E> {
    return f(this.value) ? this : new Err(e)
  }

  map<R>(f: (x: T) => R): Result<R, E> {
    return new Ok(f(this.value))
  }

  flatMap<R>(_f: (x: T) => Result<R, E>): Result<R, E> {
    throw new Error("Method not implemented.")
  }
}

export class Err<T, E> implements ResultInterface<T, E> {
  private readonly kind = "err"
  private readonly value: E
  constructor(value: E) {
    this.value = value
  }

  toString(): string {
    return `Err(${this.value})`
  }

  isOk(this: Result<T, E>): this is Ok<T, E> {
    return false
  }

  isErr(this: Result<T, E>): this is Err<T, E> {
    return true
  }

  filter(_f: (x: T) => boolean, _e: E): Result<T, E> {
    return this
  }

  map<R>(_f: (x: T) => R): Result<R, E> {
    return new Err(this.value)
  }

  flatMap<R>(_f: (x: T) => Result<R, E>): Result<R, E> {
    throw new Error("Method not implemented.")
  }
}
