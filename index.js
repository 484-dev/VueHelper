import { setCssVar, Loading } from "quasar";
import ParseVueObject from "./utils/ParseVueSubclass";
import ParseUser from "./utils/ParseUserSubclass";
import Helper from "./utils/Helper";
export const Config = {
  install(Vue, config, router) {
    const { appId, serverURL, subclasses, javascriptKey, localhost, Parse, port = 1337 } = config;
    Vue.config.globalProperties.$appInfo = config;
    const colors = config.colors || {}
    for (const color in colors) {
      setCssVar(color, colors[color]);
    }
    Parse.initialize(appId);
    Parse.serverURL = localhost ? `http://localhost:${port}/parse` : serverURL;
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
    const lastFetchQueue = {};
    Vue.config.globalProperties.$fetchIfNeeded = async (refresh, to = {}) => {
      const user = ParseUser.current();
      const auth = to && to.meta && to.meta.requiresAuth;
      if (!user && auth) {
        return '/login';
      }
      if (!user) {
        return false
      }
      const toFetch = [];
      if (refresh) {
        toFetch.push(user);
      }
      const checkIfFetch = (obj) => {
        const ids = toFetch.map(_obj => _obj?.id);
        if (!obj || !obj.fetch || !obj.isDataAvailable || ids.includes(obj.id)) {
          return;
        }
        const token = `${obj.className}-${obj.id}`;
        const lastGot = lastFetchQueue[token] || new Date('2010');
        if ((new Date().getTime() - lastGot.getTime()) < 1000) {
          return;
        }
        if (!obj.isDataAvailable(obj) || refresh) {
          toFetch.push(obj);
          lastFetchQueue[token] = new Date()
        }
      };
      checkIfFetch(user);
      for (const key in (user || {}).attributes) {
        const val = user.get(key);
        checkIfFetch(val);
      }
      const fetchCopy = [];
      for (const item of toFetch) {
        if (item) {
          fetchCopy.push(item);
        }
      }
      if (fetchCopy.length == 0) {
        return false;
      }
      try {
        await Promise.all(fetchCopy.map(obj => obj.fetch()));
      } catch (e) {
        if (e.code === 209 || e.code === 206) {
          try {
            Parse.User.logOut();
          } catch (e) {
            /* */
          }
          return '/login';
        }
      }
      if (config.handleLoaded) {
        const name = config.handleLoaded(Parse, to);
        return name;
      }
    };
    const handleRoute = (destination, to, next) => {
      if ((to.path === destination || to.name === destination) || (destination.name && destination.name === to.name)) {
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
        handleRoute(route.charAt(0) === '/' ? route : {name: route}, to, next);
      } catch (e) {
        next();
        Loading.hide();
      }
    });
  },
};
