const importGroups = require('./.eslint-import-groups.cjs')

const base = {
  /**
   * ESLint rules
   * https://eslint.org/docs/rules/
   * based on version 6.8.0
   */

  /**
   * Possible Errors
   *
   * These are unusual cases that are most often errors rather than intended code.
   * If you find an actual use case for any of these that cannot be worked around,
   * please open an issue describing your use case.
   */
  /** Enforce "for" loop update clause moving the counter in the right direction. */
  'for-direction': 'error',
  /** Enforce `return` statements in getters */
  'getter-return': 'error',
  /** Disallow using an async function as a Promise executor */
  'no-async-promise-executor': 'error',
  /** Disallow lexical declarations in case clauses */
  'no-case-declarations': 'error',
  /** Disallow comparing against -0 */
  'no-compare-neg-zero': 'error',
  /** Disallow assignment operators in conditional expressions */
  'no-cond-assign': 'error',
  /** Disallow constant expressions in conditions */
  'no-constant-condition': 'error',
  /** Disallow control characters in regular expressions */
  'no-control-regex': 'error',
  /** Disallow the use of `debugger` */
  'no-debugger': 'error',
  /** Disallow duplicate arguments in `function` definitions */
  'no-dupe-args': 'error',
  /** Disallow duplicate conditions in if-else-if chains */
  'no-dupe-else-if': 'error',
  /** Disallow duplicate keys in object literals */
  'no-dupe-keys': 'error',
  /** Disallow duplicate case labels */
  'no-duplicate-case': 'error',
  /** Disallow empty block statements */
  'no-empty': 'error',
  /** Disallow empty character classes in regular expressions */
  'no-empty-character-class': 'error',
  /** Disallow reassigning exceptions in `catch` clauses */
  'no-ex-assign': 'error',
  /** Disallow unnecessary boolean casts */
  'no-extra-boolean-cast': 'error',
  /** Disallow reassigning `function` declarations */
  'no-func-assign': 'error',
  /** Disallow assigning to imported bindings */
  'no-import-assign': 'error',
  /** Disallow variable or `function` declarations in nested blocks */
  'no-inner-declarations': 'error',
  /** Disallow invalid regular expression strings in `RegExp` constructors */
  'no-invalid-regexp': 'error',
  /** Disallow irregular whitespace */
  'no-irregular-whitespace': 'error',
  /** Disallow characters which are made with multiple code points in character class syntax */
  'no-misleading-character-class': 'error',
  /** Disallow calling global object properties as functions */
  'no-obj-calls': 'error',
  /** Disallow calling some `Object.prototype` methods directly on objects */
  'no-prototype-builtins': 'error',
  /** Disallow multiple spaces in regular expressions */
  'no-regex-spaces': 'error',
  /** Disallow returning values from setters */
  'no-setter-return': 'error',
  /** Disallow sparse arrays */
  'no-sparse-arrays': 'error',
  /** Disallow unreachable code after `return`, `throw`, `continue`, and `break` statements */
  'no-unreachable': 'error',
  /** Disallow control flow statements in `finally` blocks */
  'no-unsafe-finally': 'error',
  /** Disallow negating the left operand of relational operators */
  'no-unsafe-negation': 'error',
  /** Require calls to `isNaN()` when checking for `NaN` */
  'use-isnan': 'error',
  /** Enforce comparing `typeof` expressions against valid strings */
  'valid-typeof': 'error',

  /**
   * Best Practices
   */
  /** Enforce `return` statements in callbacks of array methods */
  'array-callback-return': ['error', { allowImplicit: true }],
  /** Require === and !== */
  eqeqeq: ['error', 'always'],
  /** Require `for-in` loops to include an `if` statement */
  'guard-for-in': 'error',
  /** Disallow `else` blocks after `return` statements in `if` statements */
  'no-else-return': 'error',
  /** Disallow empty destructuring patterns */
  'no-empty-pattern': 'error',
  /** Disallow the use of `eval()` */
  'no-eval': 'error',
  /** Disallow extending native types */
  'no-extend-native': 'error',
  /** Disallow fallthrough of `case` statements */
  'no-fallthrough': 'error',
  /** Disallow assignments to native objects or read-only global variables */
  'no-global-assign': 'error',
  /** Disallow the use of `eval()`-like methods */
  'no-implied-eval': 'error',
  /** Disallow `new` operators outside of assignments or comparisons */
  'no-new': 'error',
  /** Disallow `new` operators with the `Function` object */
  'no-new-func': 'error',
  /** Disallow `new` operators with the `String`, `Number`, and `Boolean` objects */
  'no-new-wrappers': 'error',
  /** Disallow octal literals */
  'no-octal': 'error',
  /** Disallow assignments where both sides are exactly the same */
  'no-self-assign': 'error',
  /** Disallow `javascript:` urls */
  'no-script-url': 'error',
  /** Disallow throwing literals as exceptions */
  'no-throw-literal': 'error',
  /** Disallow unused labels */
  'no-unused-labels': 'error',
  /** Disallow unnecessary `catch` clauses */
  'no-useless-catch': 'error',
  /** Disallow unnecessary escape characters */
  'no-useless-escape': 'error',

  /**
   * Variables
   */
  /** Disallow identifiers from shadowing restricted names */
  'no-shadow-restricted-names': 'error',

  /**
   * ECMAScript 6
   */
  /** Require `super()` calls in constructors */
  'constructor-super': 'error',
  /** Disallow reassigning class members */
  'no-class-assign': 'error',
  /** Disallow duplicate module imports */
  'no-duplicate-imports': 'error',
  /** Disallow `new` operators with the `Symbol` object */
  'no-new-symbol': 'error',
  /** Disallow `this`/`super` before calling `super()` in constructors */
  'no-this-before-super': 'error',
  /** Require `let` or `const` instead of `var` */
  'no-var': 'error',
  /** Require or disallow method and property shorthand syntax for object literals */
  'object-shorthand': 'error',
  /** Require `const` declarations for variables that are never reassigned after declared */
  'prefer-const': 'error',
  /** Require template literals instead of string concatenation */
  'prefer-template': 'error',
  /** Require generator functions to contain `yield` */
  'require-yield': 'error',

  /**
   * @typescript-eslint rules
   * https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin/docs/rules
   * based on version 2.29.0
   */
  /** Require that member overloads be consecutive */
  '@typescript-eslint/adjacent-overload-signatures': 'error',
  /** Disallows awaiting a value that is not a Promise */
  '@typescript-eslint/await-thenable': 'error',
  /** Bans “// @ts-ignore” comments from being used */
  '@typescript-eslint/ban-ts-comment': 'error',
  /** Bans specific types from being used */
  '@typescript-eslint/ban-types': 'error',
  /** Enforces consistent usage of type assertions */
  '@typescript-eslint/consistent-type-assertions': 'error',
  /** Consistent with type definition either interface or type */
  '@typescript-eslint/consistent-type-definitions': 'error',
  /** Disallow generic Array constructors */
  '@typescript-eslint/no-array-constructor': 'error',
  /** Disallow Empty Functions */
  '@typescript-eslint/no-empty-function': 'error',
  /** Forbids the use of classes as namespaces */
  '@typescript-eslint/no-extraneous-class': 'error',
  /** Requires Promise-like values to be handled appropriately */
  '@typescript-eslint/no-floating-promises': 'error',
  /** Disallow iterating over an array with a for-in loop */
  '@typescript-eslint/no-for-in-array': 'error',
  /** Disallows explicit type declarations for variables or parameters initialized to a number, string, or boolean */
  '@typescript-eslint/no-inferrable-types': 'error',
  /** Enforce valid definition of new and constructor */
  '@typescript-eslint/no-misused-new': 'error',
  /** Disallows non-null assertions using the ! postfix operator */
  '@typescript-eslint/no-non-null-assertion': 'error',
  /** Disallow variable redeclaration */
  '@typescript-eslint/no-redeclare': 'error',
  /** Disallows invocation of require() */
  '@typescript-eslint/no-require-imports': 'error',
  /** Disallow variable declarations from shadowing variables declared in the outer scope */
  '@typescript-eslint/no-shadow': 'error',
  /** Disallow aliasing this */
  '@typescript-eslint/no-this-alias': 'error',
  /** Disallow unused variables */
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      vars: 'all',
      args: 'after-used',
      varsIgnorePattern: '_',
      ignoreRestSiblings: true,
    },
  ],
  /** Disallow unnecessary constructors */
  '@typescript-eslint/no-useless-constructor': 'error',
  /** Disallow the use of parameter properties in class constructors */
  '@typescript-eslint/parameter-properties': 'error',
  /** Use for-of loops instead of standard for loops over arrays */
  '@typescript-eslint/prefer-for-of': 'error',
  /** Use function types instead of interfaces with call signatures */
  '@typescript-eslint/prefer-function-type': 'error',
  /** Enforce includes method over indexOf method */
  '@typescript-eslint/prefer-includes': 'error',
  /** Require never-modified private members be marked as readonly */
  '@typescript-eslint/prefer-readonly': 'error',
  /** Enforce the use of String#startsWith and String#endsWith instead of other equivalent methods of checking substrings */
  '@typescript-eslint/prefer-string-starts-ends-with': 'error',
  /** Enforce giving compare argument to Array#sort */
  '@typescript-eslint/require-array-sort-compare': 'error',
  /** Disallow async functions which have no await expression */
  '@typescript-eslint/require-await': 'error',
  /** When adding two variables, operands must both be of type number or of type string */
  '@typescript-eslint/restrict-plus-operands': 'error',
  /** Sets preference level for triple slash directives versus ES6-style import declarations */
  '@typescript-eslint/triple-slash-reference': 'error',
  /** Warns for any two overloads that could be unified into one by using a union or an optional/rest parameter */
  '@typescript-eslint/unified-signatures': 'error',

  /**
   * react rules
   * https://github.com/yannickcr/eslint-plugin-react
   * based on version 7.19.0
   */
  /** Enforce curly braces or disallow unnecessary curly braces in JSX props and/or children */
  'react/jsx-curly-brace-presence': [
    'error',
    { props: 'never', children: 'never' },
  ],
  /** Detect missing key prop */
  'react/jsx-key': 'error',
  /** No .bind() or Arrow Functions in JSX Props */
  'react/jsx-no-bind': 'error',
  /** Prevent comments from being inserted as text nodes */
  'react/jsx-no-comment-textnodes': 'error',
  /** Prevent duplicate properties in JSX */
  'react/jsx-no-duplicate-props': 'error',
  /** Prevent usage of unsafe target='_blank' */
  'react/jsx-no-target-blank': 'error',
  /** Disallow undeclared variables in JSX */
  'react/jsx-no-undef': 'error',
  /** Prevent variables used in JSX to be incorrectly marked as unused */
  'react/jsx-uses-vars': 'error',
  /** Prevent passing of children as props */
  'react/no-children-prop': 'error',
  /** Prevent problem with children and props.dangerouslySetInnerHTML */
  'react/no-danger-with-children': 'error',
  /** Prevent usage of deprecated methods */
  'react/no-deprecated': 'error',
  /** Prevent invalid characters from appearing in markup */
  'react/no-unescaped-entities': 'error',
  /** Enforce ES5 or ES6 class for returning value in render function */
  'react/require-render-return': 'error',

  /**
   * react hooks rules
   * https://github.com/facebook/react/tree/master/packages/eslint-plugin-react-hooks
   * based on version 3.0.0
   */
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'error',

  'simple-import-sort/imports': [
    'error',
    {
      groups: importGroups,
    },
  ],
}

// Slower rules, not included when running in editor but only when running from CLI.
const extended = {
  // special case where 'warn' is used over 'error'
  'deprecation/deprecation': 'warn',

  'react/no-direct-mutation-state': 'error',

  '@typescript-eslint/no-unnecessary-type-arguments': 'error',
  '@typescript-eslint/unbound-method': ['error', { ignoreStatic: true }],
}

module.exports = { base, extended }
