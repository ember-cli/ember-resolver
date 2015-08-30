import Ember from 'ember';

let create = (Object.create || Ember.create);
if (!(create && !create(null).hasOwnProperty)) {
  throw new Error("This browser does not support Object.create(null), please polyfil with es5-sham: http://git.io/yBU2rg");
}

export default create;
