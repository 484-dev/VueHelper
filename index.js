import { colors, Loading } from "quasar";
import { Parse } from "parse";
import ParseVueObject from "./utils/ParseVueSubclass";
import ParseUser from "./utils/ParseUserSubclass";
import Helper from "./utils/Helper";
export  {default as Login} from "./components/Login"
export  {default as User} from "./components/User"
export const Config = {
  install(Vue, config, router) {
    const { appId, serverURL, subclasses, javascriptKey, localhost } = config;
    Vue.prototype.$appInfo = config;
    colors.setBrand("dark", config.colors.background);
    colors.setBrand("primary", config.colors.primary);
    Parse.initialize(appId);
    Parse.serverURL = localhost ? 'http://localhost:1337/parse' : serverURL;
    if (javascriptKey) {
      Parse.initialize(appId, javascriptKey);
    }
    Parse.User.allowCustomUserClass(true);
    for (const sub of subclasses) {
      Parse.Object.registerSubclass(sub, ParseVueObject);
    }
    Parse.Object.registerSubclass("_User", ParseUser);
    Object.assign(Vue.prototype, Helper);
    Vue.prototype.$Parse = Parse;
    Vue.prototype.$currentUser = ParseUser.current;

    const fetchIfNeeded = async (refresh, to, next) => {
      const user = ParseUser.current();
      if (!user) {
        return;
      }
      const toFetch = [];
      const checkIfFetch = (obj) => {
        if (!obj.isDataAvailable(obj) || refresh) {
          toFetch.push(obj.fetch());
        }
      };
      checkIfFetch(user);
      for (const key in user.attributes) {
        const val = user.get(key);
        if (val && val.id) {
          checkIfFetch(val);
        }
      }
      if (toFetch.length == 0) {
        return;
      }
      try {
        await Promise.all(toFetch);
      } catch (e) {
        if (e.code == 209) {
          await Parse.User.logOut();
          handleRoute("/login", to, next);
        }
      }
      if (config.handleLoaded) {
        config.handleLoaded();
      }
    };
    Vue.prototype.$fetchIfNeeded = fetchIfNeeded;
    const handleRoute = (destination, to, next) => {
      if (to.path === destination) {
        next();
        return;
      }
      next(destination);
    };
    router.beforeEach(async (to, from, next) => {
      Loading.show();
      const auth = to.meta.requiresAuth;
      await fetchIfNeeded(from.path === "/", to, next);
      Loading.hide();
      if (!ParseUser.current()) {
        if (auth) {
          handleRoute("/login", to, next);
        } else {
          next();
        }
        return;
      }
      next();
    });
  },
};
