import { Parse } from 'parse';
import proxyHandler from './Proxy';
class ParseUser extends Parse.User {
  constructor() {
    super('_User');
    return new Proxy(this, proxyHandler);
  }
}
export default ParseUser;
