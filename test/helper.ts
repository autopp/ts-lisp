// eslint-disable-next-line @typescript-eslint/no-explicit-any

export function describeEach<T extends any[]>(
  table: [string, ...T][],
  fn: (...args: T) => any,
  timeout?: number
): void {
  describe.each(table)(
    "%s",
    (_name, ...args: T) => {
      fn(...args)
    },
    timeout
  )
}
