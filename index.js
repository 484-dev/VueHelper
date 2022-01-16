import { setCssVar, Loading } from "quasar";
import ParseVueObject from "./utils/ParseVueSubclass";
import ParseUser from "./utils/ParseUserSubclass";
import Helper from "./utils/Helper";
export const Config = {
  install(Vue, config, router) {
    const { appId, serverURL, subclasses, javascriptKey, localhost, Parse } = config;
    Vue.config.globalProperties.$appInfo = config;
    setCssVar("dark", config.colors.background);
    setCssVar("primary", config.colors.primary);
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
    Object.assign(Vue.config.globalProperties, Helper);

    Vue.config.globalProperties.$ParseUser = ParseUser;
    Vue.config.globalProperties.$ParseObject = ParseVueObject;
    Vue.config.globalProperties.$Parse = Parse;
    Vue.config.globalProperties.$currentUser = ParseUser.current;
    Vue.config.globalProperties.$fetchIfNeeded = async (refresh, to = {}) => {
      const user = ParseUser.current();
      const auth = to && to.meta && to.meta.requiresAuth;
      if (!user && auth) {
        return '/login';
      }
      const toFetch = [];
      if (refresh) {
        toFetch.push(user);
      }
      const checkIfFetch = (obj) => {
        const ids = toFetch.map(obj => obj.id);
        if (!obj || !obj.fetch || !obj.isDataAvailable || ids.includes(obj.id)) {
          return;
        }
        if (!obj.isDataAvailable(obj) || refresh) {
          toFetch.push(obj);
        }
      };
      checkIfFetch(user);
      for (const key in (user || {}).attributes) {
        const val = user.get(key);
        checkIfFetch(val);
      }
      if (toFetch.length == 0) {
        return false;
      }
      try {
        await Promise.all(toFetch.map(obj => obj.fetch()));
      } catch (e) {
        if (e.code === 209 || e.code === 206) {
          try {
            await Parse.User.logOut();
          } catch (e) {
            /* */
          }
          return '/login';
        }
      }
      if (config.handleLoaded) {
        const name = config.handleLoaded(Parse);
        return name;
      }
    };
    const handleRoute = (destination, to, next) => {
      if (to.path === destination || to.name === destination || destination.name === to.name) {
        next();
        return true;
      }
      next(destination);
      return true;
    };
    router.beforeEach(async (to, from, next) => {
      try {
        Loading.show();
        const route = await Vue.config.globalProperties.$fetchIfNeeded(from.path === "/", to);
        Loading.hide();
        if (route === false) {
          next();
          return;
        }
        handleRoute(route, to, next);
      } catch (e) {
        next();
        Loading.hide();
      }
    });
  },
};
