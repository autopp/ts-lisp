# ts-lisp

A toy lisp implementation by TypeScript.

E.g.
```
npm start -- "(define fact (lambda (n) (if (eq? n 0) 1 (* n (fact (- n 1)))))) (print (fact 4))"
24
```

License: Apache 2.0
