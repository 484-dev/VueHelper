import { colors, Loading } from "quasar";
import { Parse } from "parse";
import ParseVueObject from "./utils/ParseVueSubclass";
import ParseUser from "./utils/ParseUserSubclass";
import Helper from "./utils/Helper";
import Login from "./components/Login"
module.exports = {
  Login,
  Config: {
    install(Vue, config, router) {
      const { appId, serverURL, subclasses } = config;
      Vue.prototype.$appInfo = config;
      colors.setBrand("dark", config.colors.background);
      colors.setBrand("primary", config.colors.primary);
      Parse.initialize(appId);
      Parse.serverURL = serverURL;
      Parse.User.allowCustomUserClass(true);
      for (const sub of subclasses) {
        Parse.Object.registerSubclass(sub, ParseVueObject);
      }
      Parse.Object.registerSubclass("_User", ParseUser);
      Object.assign(Vue.prototype, Helper);
      Vue.prototype.$Parse = Parse;

      const fetchIfNeeded = async (refresh, to, next) => {
        const user = Parse.User.current();
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
        if (!Parse.User.current()) {
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
  }
};
