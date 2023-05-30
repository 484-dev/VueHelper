import Parse from 'parse';
import proxyHandler from './Proxy';
class ParseUser extends Parse.User {
  constructor(...args) {
    super(...args);
    return new Proxy(this, proxyHandler);
  }
}
export default ParseUser;
