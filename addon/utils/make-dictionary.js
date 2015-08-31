import create from './create';

export default function makeDictionary() {
  var cache = create(null);
  cache['_dict'] = null;
  delete cache['_dict'];
  return cache;
}
