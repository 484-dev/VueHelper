const proxyHandler = {
  get(target, key, receiver) {
    const value = target[key];
    const reflector = Reflect.get(target, key, receiver);
    if (reflector || proxyHandler._isInternal(key, value)) {
      return reflector;
    }
    return receiver.get(key);
  },

  set(target, key, value, receiver) {
    const current = target[key];
    const reflector = Reflect.set(target, key, value, receiver);
    if (reflector || proxyHandler._isInternal(key, current)) {
      return reflector
    }
    return receiver.set(key, value);
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
