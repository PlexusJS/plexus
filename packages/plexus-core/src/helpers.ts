
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

export class EventEmitter<Data=any> {
  events: Map<string|number, Data>
  constructor() {
    this.events = new Map();
  }
  on(event: string | number, listener: (...args: any[]) => void) {
    if (!(event in this.events)) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return () => this.removeListener(event, listener);
  }
  removeListener(event: string | number, listener: (...args: any[]) => void) {
    if (!(event in this.events)) {
       return;
    }
    const idx = this.events[event].indexOf(listener);
    if (idx > -1) {
      this.events[event].splice(idx, 1);
    }
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
  }
  emit(event: string | number, ...args: any) {
    if (!(event in this.events)) {
        return;
     }
    this.events[event].forEach(listener => listener(...args));
  }
  once(event: string | number, listener: (...args: any[]) => void) {
     const remove = this.on(event, (...args) => {
       remove();
       listener(...args);
    });
  }
};