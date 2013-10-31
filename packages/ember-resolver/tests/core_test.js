/*globals define registry */

var resolver;

module("Resolver Tests",{
  setup: function(){
    resolver = registry['resolver'][2]();
  }
});

test("can access Resolver", function(){
  ok(resolver);
});
