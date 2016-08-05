module.exports.measure = function(cb) {
  var start;

  return new Promise(function(resolve) {
    start = Date.now();
    var result = cb();
    if (typeof result === 'object') {
      resolve(result);
    } else {
      resolve({
        time: Date.now() - start
      });
    }
  }).then(function() {
    return {
      time: Date.now() - start
    };
  });
};
