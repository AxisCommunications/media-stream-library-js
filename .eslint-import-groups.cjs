const packageJsons = ['./overlay', './player', './streams'].map((path) =>
  require(path + '/package.json')
)

const externalDeps = [
  ...new Set(
    packageJsons
      .flatMap(({ dependencies, peerDependencies, devDependencies }) => {
        return [
          ...Object.keys(dependencies ?? {}),
          ...Object.keys(peerDependencies ?? {}),
          ...Object.keys(devDependencies ?? {}),
        ]
      })
      .map((dep) => dep.replace(/\/.*$/, ''))
  ),
].sort()

const nodeDeps = [
  'child_process',
  'crypto',
  'dgram',
  'electron',
  'fs',
  'http',
  'https',
  'net',
  'os',
  'path',
  'tls',
  'url',
]
const reactDeps = ['react', 'react-dom']
const baseUrlPatterns = ['^[a-z_]']
const parentPatterns = ['^\\.\\.']
const siblingPatterns = ['^\\.']
const nakedImports = ['^\\u0000']

module.exports = [
  nakedImports,
  nodeDeps.map((dep) => `^${dep}$`),
  reactDeps.map((dep) => `^${dep}(\\/|$)`),
  externalDeps.map((dep) => `^${dep}(\\/|$)`),
  baseUrlPatterns,
  parentPatterns,
  siblingPatterns,
]
