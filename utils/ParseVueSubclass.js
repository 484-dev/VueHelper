import { Parse } from 'parse';
class ParseVueObject extends Parse.Object {
  constructor(className, json) {
    super(className);
    if (json) {
      for (const key in json) {
        this.set(key, json[key]);
      }
    }
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
  pointer(className) {
    const obj = Parse.Object.fromJSON({
      className: 'newTestClassName',
      objectId: this.id
    });
    obj.className = className || this.className;
    return obj;
  }
  set(key, value) {
    super.set(key, value);
    this[key] = value;
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
    this.loadData();
  }
  revert(...keys) {
    super.revert(...keys);
    this.loadData();
  }
  _finishFetch(serverData) {
    super._finishFetch(serverData);
    this.loadData();
  }
}
export default ParseVueObject;
