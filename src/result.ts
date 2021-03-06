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
  readonly value: T
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

  flatMap<R>(f: (x: T) => Result<R, E>): Result<R, E> {
    return f(this.value)
  }
}

export class Err<T, E> implements ResultInterface<T, E> {
  private readonly kind = "err"
  readonly reason: E
  constructor(value: E) {
    this.reason = value
  }

  cast<R>(): Err<R, E> {
    return new Err(this.reason)
  }

  toString(): string {
    return `Err(${this.reason})`
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
    return new Err(this.reason)
  }

  flatMap<R>(_f: (x: T) => Result<R, E>): Result<R, E> {
    return new Err(this.reason)
  }
}

export function cond<T, E>(
  c: boolean,
  okVal: () => T,
  errVal: () => E
): Result<T, E> {
  return c ? new Ok(okVal()) : new Err(errVal())
}

export function mapWithResult<T, R, E>(
  array: T[],
  f: (x: T, i: number) => Result<R, E>
): Result<R[], E> {
  const results: R[] = []
  for (let i = 0; i < array.length; i++) {
    const result = f(array[i], i)
    if (result.isErr()) {
      return result.cast<R[]>()
    }
    results.push(result.value)
  }

  return new Ok(results)
}

export function reduceWithResult<T, R, E>(
  array: T[],
  f: (acc: R, x: T, i: number) => Result<R, E>,
  initial: R
): Result<R, E> {
  let acc = initial
  for (let i = 0; i < array.length; i++) {
    const r = f(acc, array[i], i)
    if (r.isErr()) {
      return r
    }
    acc = r.value
  }

  return new Ok(acc)
}
