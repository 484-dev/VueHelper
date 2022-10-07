import { Parse } from "parse";
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
    const cache = Parse.CoreManager.getObjectStateController().getObjectCache(
      this._getStateIdentifier()
    )
    for (const field of fields) {
      try {
        this[field] = Parse._encode(JSON.parse(cache[field]));
      } catch (e) {
        this[field] = Parse._encode(cache[field]);
      }
    }
    super.revert(...fields);
    this.dirtyKeys = this.dirtyKeys.bind(this);
  }
}
export default ParseVueObject;
