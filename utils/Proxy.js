import { Parse } from "parse";
const nestedHandler = {
  updateParent(key, value) {
    const levels = this._path.split('.');
    levels.push(key);
    const topLevel = levels[0];
    levels.shift();
    const scope = JSON.parse(JSON.stringify(this._parent[topLevel]));
    let target = scope;
    const max_level = levels.length - 1;
    levels.some((level, i) => {
      if (typeof level === 'undefined') {
        return true;
      }
      if (i === max_level) {
        target[level] = value;
      } else {
        const obj = target[level] || {};
        target = obj;
      }
    });
    this._parent[topLevel] = scope;
  },
  get(target, key, receiver) {
    const reflector = Reflect.get(target, key, receiver);
    const prop = target[key];
    if (Object.prototype.toString.call(prop) === '[object Object]' && !prop instanceof Parse.Object) {
      const thisHandler = { ...nestedHandler };
      thisHandler._path = `${this._path}.${key}`;
      thisHandler._parent = this._parent;
      return new Proxy({ ...prop }, thisHandler);
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
    if (Object.prototype.toString.call(getValue) === '[object Object]' && !getValue instanceof Parse.Object) {
      const thisHandler = { ...nestedHandler };
      thisHandler._path = key;
      thisHandler._parent = receiver;
      return new Proxy({ ...getValue }, thisHandler);
    }
    return getValue ?? reflector;
  },

  set(target, key, value, receiver) {
    const current = target[key];
    if (proxyHandler._isInternal(key, current)) {
      return Reflect.set(target, key, value, receiver);
    }
    const returnValue = receiver.set(key, value);
    receiver.dirtyKeys = receiver.dirtyKeys.bind(receiver);
    return returnValue;
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
      'objectId',
      'id',
      'className',
      'attributes',
      'createdAt',
      'updatedAt',
      'then',
    ]);
    return (
      typeof value === 'function' ||
      key.toString().charAt(0) === '_' ||
      internalFields.includes(key.toString())
    );
  },
};
export default proxyHandler;
