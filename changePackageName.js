const fs = require('fs');
const yargs = require('yargs');

// Parse the arguments to get the name to use
const { name } = yargs
  .command('changePackageName.js', 'Change the package name of the library in package.json')
  .option('name', {
    description: 'The new name of rht package',
    type: 'string'
  })
  .help()
  .alias('help', 'h').demandOption(["name"]).argv;

const pkg = require('./package.json');
pkg.name = name;
const packageString = JSON.stringify(pkg, null, 2)
fs.writeFileSync('package.json', packageString);
