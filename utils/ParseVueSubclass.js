import { Parse } from 'parse';
class ParseVueObject extends Parse.Object {
  constructor(className) {
    super(className);
    this.loadData();
  }
  loadData() {
    const internal = ['id', 'className', 'createdAt', 'updatedAt', 'ACL'];
    const data = this.attributes;
    for (const key in data) {
      if (internal.includes(key)) {
        continue;
      }
      this[key] = data[key];
    }
  }
  async save() {
    const internal = ['id', 'className', 'createdAt', 'updatedAt', 'ACL'];
    for (const key in this) {
      if (internal.includes(key)) {
        continue;
      }
      if (JSON.stringify(this[key]) !== JSON.stringify(this.get(key))) {
        this.set(key, this[key]);
      }
    }
    await super.save();
  }
  _finishFetch(serverData) {
    super._finishFetch(serverData);
    this.loadData();
  }
}
export default ParseVueObject;
