import { Parse } from 'parse';
import proxyHandler from './Proxy';
class ParseVueObject extends Parse.Object {
  constructor(className) {
    super(className);
    return new Proxy(this, proxyHandler);
  }
}
export default ParseVueObject;
