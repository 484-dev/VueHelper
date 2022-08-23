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
}
export default ParseVueObject;
