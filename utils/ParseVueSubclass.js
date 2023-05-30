import Parse from 'parse/dist/parse.min.js';
import proxyHandler from "./Proxy";
class ParseVueObject extends Parse.Object {
  constructor(...args) {
    super(...args);
    return new Proxy(this, proxyHandler);
  }
  async debounce(delay = 500) {
    if (this._timeout) {
      clearTimeout(this._timeout);
    }
    this._timeout = setTimeout(() => {
      this.save();
    }, delay);
  }
  revert(...fields) {
    if (!fields.length) {
      fields = this.dirtyKeys();
    }
    const response = super.revert(...fields);
    for (const field of fields) {
      this[field] = { '_proxy_op': 'fetch'};
    }
    this.dirtyKeys = this.dirtyKeys.bind(this);
    return response;
  }
  _finishFetch(serverData) {
    const response = super._finishFetch(serverData);
    for (const field in serverData) {
      if (['objectId', 'ACL', 'createdAt', 'updatedAt'].includes(field)) {
        continue;
      }
      this[field] = { '_proxy_op': 'fetch' };
    }
    return response;
  }
  async save(...args) {
    const response = await super.save(...args);
    this.dirtyKeys = this.dirtyKeys.bind(this);
    return response;
  }
}
export default ParseVueObject;
