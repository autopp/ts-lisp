/* eslint-disable @typescript-eslint/no-explicit-any */

export function describeEach<T extends any[]>(
  table: [string, ...T][],
  fn: (...args: T) => any
): void

export function describeEach<T extends any[]>(
  name: string,
  table: [...T][],
  fn: (...args: T) => any
): void

export function describeEach<T extends any[]>(
  ...args:
    | [table: [string, ...T][], fn: (...args: T) => any]
    | [name: string, table: [...T][], fn: (...args: T) => any]
): void {
  if (args.length === 2) {
    const [table, fn] = args
    describe.each(table)("%s", (_name, ...args: T) => {
      fn(...args)
    })
  } else {
    const [name, table, fn] = args
    describe.each(table)(name, fn)
  }
}
