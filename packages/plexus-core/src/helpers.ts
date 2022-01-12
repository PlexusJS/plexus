
export function isObject (item: any): item is Object {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export function deepMerge (target: Object, source: Object): any {
  let output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    }
  }
  return output;
}