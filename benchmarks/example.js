var ps = require('child_process');
var series = require('promise-map-series');
var ora = require('ora');
var tests = [];
var ara = require('ara');
var path = require('path');
var file = process.argv[2];

for (var i = 0; i < 50; i++) {
  tests.push({
    id: i,
    run: function() {
      var worker = new ara.EvalWorker();

      return worker.run(function(file) {
        return require(file)();
      }, path.resolve(file)).finally(function() {
        worker.terminate();
      });
  }});
}

var spinner = ora('running...');

console.log('Benchmark');
console.log('  file: ' + file);

spinner.start();

series(tests, function(test) {
  spinner.text = 'running... (' + test.id+ '/' + tests.length + ')';

  return test.run();
}).then(function(results) {
  spinner.stop();

  var total = results.reduce(function(sum, result) {
    return sum + result.time;
  }, 0);

  console.log('  total: ', total + 'ms')
  console.log('  per op: ', total / results.length + 'ms');
}).catch(function(reason) {
  console.error(reason);
  process.exit(1);
});
