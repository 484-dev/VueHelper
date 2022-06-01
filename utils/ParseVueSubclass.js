import { Parse } from 'parse';
import proxyHandler from './Proxy';
class ParseVueObject extends Parse.Object {
  constructor(...args) {
    super(...args);
    return new Proxy(this, proxyHandler);
  }
  inspect() {
    return this.attributes;
  }
}
export default ParseVueObject;
