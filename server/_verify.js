try {
  require('./routes/problem')
  console.log('Routes OK')
  // Quick check that index.js parses correctly
  const fs = require('fs')
  const src = fs.readFileSync('./index.js', 'utf8')
  new Function(src.replace(/require\(/g, '//require(').replace(/module\.exports/g, '//module.exports'))
  console.log('Server syntax OK')
  process.exit(0)
} catch(e) {
  console.error('FAIL:', e.message)
  process.exit(1)
}
