import create from './create';

export default function makeDictionary() {
  let cache = create(null);
  cache['_dict'] = null;
  delete cache['_dict'];
  return cache;
}
