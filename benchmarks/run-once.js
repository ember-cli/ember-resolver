var file = process.argv[2];
var path = require('path');

require(path.resolve(process.argv[2]))().then(function(result) {
  console.log(result);
}).catch(function(reason) {
  console.log(reason);
  process.exit(1);
});
