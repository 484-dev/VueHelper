import * as func from 'deepcopy';
const deepcopy = func.default || func;
const nestedHandler = {
  updateParent(key, value) {
    const levels = this._path.split(".");
    levels.push(key);
    const topLevel = levels[0];
    levels.shift();
    const copiedParent = Array.isArray(this._parent[topLevel]) ? [...this._parent[topLevel]] : {...this._parent[topLevel]};
    const scope = deepcopy(copiedParent);
    let target = scope;
    const max_level = levels.length - 1;
    levels.some((level, i) => {
      if (typeof level === "undefined") {
        return true;
      }
      if (i === max_level) {
        if (value == null) {
          delete target[level];
        } else {
          target[level] = value;
        }
      } else {
        const obj = target[level] || (this._array ? [] : {});
        target = obj;
      }
    });
    this._parent[topLevel] = scope;
  },
  get(target, key, receiver) {
    const reflector = Reflect.get(target, key, receiver);
    const prop = target[key];
    if (
      Array.isArray(prop) ||
      (Object.prototype.toString.call(prop) === "[object Object]" && prop?.constructor?.name === 'Object')
      ) {
        const thisHandler = { ...nestedHandler };
        thisHandler._path = `${this._path}.${key}`;
        thisHandler._parent = this._parent;
        const isArray = Array.isArray(prop)
        thisHandler._array = isArray
        const copied = isArray ? [...prop] : {...prop};
      return new Proxy(copied, thisHandler);
    }
    return reflector;
  },
  set(target, key, value) {
    target[key] = value;
    this.updateParent(key, value);
    return true;
  },
  deleteProperty(target, key) {
    const response = delete target[key];
    this.updateParent(key);
    return response;
  },
};
const proxyHandler = {
  get(target, key, receiver) {
    const value = target[key];
    const reflector = Reflect.get(target, key, receiver);
    if (reflector || proxyHandler._isInternal(key, value)) {
      return reflector;
    }
    const getValue = receiver.get(key);
    if (
      Array.isArray(getValue) ||
      (Object.prototype.toString.call(getValue) === "[object Object]" && getValue?.constructor?.name === 'Object')
    ) {
      const thisHandler = { ...nestedHandler };
      thisHandler._path = key;
      thisHandler._parent = receiver;
      const copied = Array.isArray(getValue) ? [...getValue] : {...getValue};
      return new Proxy(copied, thisHandler);
    }
    return getValue ?? reflector;
  },

  set(target, key, value, receiver) {
    const current = target[key];
    if (proxyHandler._isInternal(key, current)) {
      return Reflect.set(target, key, value, receiver);
    }
    if (
      Object.prototype.toString.call(value) === "[object Object]" &&
      value._proxy_op === "fetch"
    ) {
      return true;
    }
    receiver.set(key, value);
    receiver.dirtyKeys = receiver.dirtyKeys.bind(receiver);
    return true;
  },

  deleteProperty(target, key) {
    const current = target[key];
    if (proxyHandler._isInternal(key, current)) {
      return delete target[key];
    }
    return target.unset(key);
  },

  _isInternal(key, value) {
    const internalFields = Object.freeze([
      "objectId",
      "id",
      "className",
      "attributes",
      "createdAt",
      "updatedAt",
      "then",
    ]);
    return (
      typeof value === "function" ||
      key.toString().charAt(0) === "_" ||
      internalFields.includes(key.toString())
    );
  },

};
export default proxyHandler;
