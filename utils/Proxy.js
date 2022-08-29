const _internalFields = Object.freeze([
  'objectId',
  'id',
  'className',
  'attributes',
  'createdAt',
  'updatedAt',
  'then',
]);
const proxyHandler = {
  get(target, key, receiver) {
    const value = target[key];
    const reflector = Reflect.get(target, key, receiver);
    if (
      typeof value === 'function' ||
      key.toString().charAt(0) === '_' ||
      _internalFields.includes(key.toString())
    ) {
      return reflector
    }
    return receiver.get(key) ?? reflector;
  },

  set(target, key, value, receiver) {
    const current = target[key];
    if (
      typeof current !== 'function' &&
      !_internalFields.includes(key.toString()) &&
      key.toString().charAt(0) !== '_'
    ) {
      receiver.set(key, value);
    }
    return Reflect.set(target, key, value, receiver);
  },

  deleteProperty(target, prop) {
    return target.unset(prop);
  }
};
export default proxyHandler;
