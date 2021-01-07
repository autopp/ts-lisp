import { makeBuiltinEnv } from "./builtin"
import { evalSExpr } from "./eval"
import { parseProgram } from "./parser"
import { Ok } from "./result"

const result = parseProgram(process.argv[2]).flatMap((sexprs) => {
  const env = makeBuiltinEnv()
  for (const sexpr of sexprs) {
    const result = evalSExpr(sexpr, env)
    if (result.isErr()) {
      return result.cast<undefined>()
    }
  }
  return new Ok(undefined)
})

if (result.isErr()) {
  console.log(result.reason)
  process.exit(1)
}
