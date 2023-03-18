// eslint-disable-next-line @typescript-eslint/no-require-imports
const rules = require('./.eslint-rules.cjs')

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    allowAutomaticSingleRunInference: true,
    ecmaFeatures: { jsx: true },
    ecmaVersion: 2022,
    project: [
      './tsconfig.eslint.json',
      './overlay/tsconfig.json',
      './player/tsconfig.json',
      './streams/tsconfig.json',
      './example-overlay-react/tsconfig.json',
    ],
    sourceType: 'module',
    tsconfigRootDir: __dirname,
  },
  env: {
    es6: true,
  },
  plugins: [
    '@typescript-eslint',
    'deprecation',
    'react',
    'react-hooks',
    'simple-import-sort',
  ],
  rules: {
    ...rules.base,
  },
  settings: {
    react: { version: '18' },
  },
  ignorePatterns: ['**/dist/'],
}
