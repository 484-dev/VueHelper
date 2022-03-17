import { Parse } from 'parse';
class ParseUser extends Parse.User {
  constructor() {
    super('_User');
    this.loadData();
  }
  loadData() {
    const internal = ['id', 'objectId', 'className', 'createdAt', 'updatedAt', 'ACL', 'sessionToken'];
    const data = this.attributes;
    for (const key in data) {
      if (internal.includes(key)) {
        continue;
      }
      this[key] = data[key];
    }
  }
  set(key, value) {
    super.set(key, value);
    this[key] = value;
  }
  async save() {
    const internal = ['id', 'objectId', 'className', 'createdAt', 'updatedAt', 'ACL', 'sessionToken'];
    for (const key in this) {
      if (internal.includes(key)) {
        continue;
      }
      if (JSON.stringify(this[key]) !== JSON.stringify(this.get(key))) {
        this.set(key, this[key]);
      }
    }
    await super.save();
    this.loadData();
  }
  revert() {
    super.revert();
    this.loadData();
  }
  _finishFetch(serverData) {
    super._finishFetch(serverData);
    this.loadData();
  }
}
export default ParseUser;
