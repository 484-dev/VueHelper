import ParseVueObject from "./ParseVueSubclass";
import imageCompression from "browser-image-compression";
import sanitizeHtml from "sanitize-html";
import { Platform, copyToClipboard, date, openURL } from "quasar";
import Parse from "parse";
const makeId = (length = 8) => {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
const messages = {};
let isChanging = false;
export default {
  async $validateFields(...fields) {
    if (Array.isArray(fields[0])) {
      fields = fields[0];
    }
    if (!fields.length) {
      fields = Object.keys(this.$refs);
    }
    try {
      await this.$nextTick();
      let allowed = true;
      if (!this.$refs) {
        throw new Error("Please set refs.");
      }
      for (const field of fields) {
        const fd = this.$refs[field];
        if (!fd) {
          throw new Error(`this.$refs ${field} is not defined.`);
        }
        if (!fd?.validate) {
          continue;
        }
        fd.validate();
        if (allowed && fd.hasError) {
          allowed = false;
        }
      }
      if (!allowed) {
        throw new Error("Could not validate fields.");
      }
    } catch (e) {
      this.$showError(e);
    }
  },
  $showError(error, throwErr) {
    this.$q.loading.hide();
    if (!error) {
      error = "An unknown error occurred.";
    }
    if (error.message) {
      error = error.message;
    }
    if (!messages[error]) {
      const id = makeId();
      window[`dismiss-${id}`] = this.$q.notify({
        message: `<div onclick="window['dismiss-${id}']?.()">${sanitizeHtml(error)}</div>`,
        type: "error",
        duration: 2000,
        html: true,
        onDismiss() {
          delete window[`dismiss-${id}`];
          delete messages[error];
        },
      });
      messages[error] = true;
      window.TapticEngine?.notification?.({
        type: "error",
      });
    }
    if (throwErr !== undefined) {
      return;
    }
    throw error;
  },
  $showMessage(message) {
    if (!message) {
      return;
    }
    if (message.message) {
      message = message.message;
    }
    if (messages[message]) {
      return;
    }
    messages[message] = true;
    const id = makeId();
    window[`dismiss-${id}`] = this.$q.notify({
      message: `<div onclick="window['dismiss-${id}']()">${sanitizeHtml(message)}</div>`,
      type: "error",
      duration: 2000,
      html: true,
      onDismiss() {
        delete window[`dismiss-${id}`];
        delete messages[message];
      },
    });
    window.TapticEngine?.notification?.({
      type: "error",
    });
  },
  async $resolve(promise, silent) {
    if (!promise) {
      throw new Error("Please pass a promise.");
    }

    if (!silent) {
      if (this.loadingState !== undefined) {
        this.loadingState = true;
      } else {
        this.$q.loading.show();
      }
    }
    try {
      return await Promise.race([Promise.resolve(promise), new Promise((_,reject) => setTimeout(() => reject(new Parse.Error(100, "")), 10 * 1000))]);
    } catch (e) {
      if (e.code === 100) {
        e.message = e.message === "Too many requests" ? e.message : `Could not connect to the server. Please check your internet connect or try again later.`;
      }
      if (e.code === 8000) {
        if (this.$route.name !== e.message && !isChanging) {
          isChanging = true;
          this.$router.push({
            name: e.message,
          });
          setTimeout(() => {
            isChanging = false;
          }, 1000);
        }
        return;
      }
      if (e.code === 206 || e.code === 209 || e.message?.includes("Please login to continue")) {
        const logout = async () => {
          try {
            await Parse.User.logOut();
          } catch (e) {
            /* */
          }
          location.reload();
        };
        await logout();
        return;
      }
      this.$showError(e);
    }
    finally {
      if (this.loadingState) {
        this.loadingState = false;
      }
      if (!silent) {
        this.$q.loading.hide();
      }
    }
  },
  $random(maximum, minimum) {
    if (maximum < minimum) {
      const min = minimum;
      minimum = maximum;
      maximum = min;
    }
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
  },
  $timeout(duration) {
    return new Promise((resolve) => setTimeout(resolve, duration));
  },
  $getFile(fileURL) {
    if (Platform.is.android && !fileURL.includes("file://")) {
      fileURL = `file://${fileURL}`;
    }
    return new Promise((resolve, reject) => {
      window.resolveLocalFileSystemURL(
        fileURL,
        (fileEntry) => {
          fileEntry.file(
            (file) => {
              resolve(file);
            },
            (err) => {
              reject(err);
            }
          );
        },
        (error) => reject(error)
      );
    });
  },
  async $getLocation() {
    const defaultPos = new Parse.GeoPoint({
      latitude: -37.813629,
      longitude: 144.963058,
    });
    if (navigator.geolocation) {
      const getPosition = async () => {
        navigator.geolocation.getCurrentPosition(
          function () {
          },
          function () {
          },
          {}
        );
        const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { maximumAge: 10000, timeout: 5000, enableHighAccuracy: true }));
        if (position) {
          const { latitude, longitude } = position.coords;
          return new Parse.GeoPoint({ latitude, longitude });
        }
      };
      try {
        return await getPosition();
      } catch (e) {
        console.log(e);
        if (e.PERMISSION_DENIED) {
          throw new Error(`Could not determine location - location permission has been denied. Please check the app's settings`);
        }
        throw e;
      }
    }
    return defaultPos;
  },
  $capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },
  async $getPicture({ edit = true, camera = false } = {}) {
    const getImg = () => {
      return new Promise((resolve, reject) => {
        if (!navigator.camera) {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".png, .jpg, .jpeg";
          const timeout = setTimeout(() => {
            reject("No file selected.");
          }, 60000);
          const submitted = () => {
            if (input.files.length === 0) {
              reject("No file selected.");
              return;
            }
            resolve(input.files[0]);
            clearTimeout(timeout);
          };
          input.addEventListener("change", submitted);
          input.click();
        } else {
          navigator.camera.getPicture(
            (fileLocation) => {
              (async () => {
                try {
                  const file = await imageCompression.getFilefromDataUrl(`data:image/jpg;base64,${fileLocation}`, "image.jpg");
                  const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 800,
                    useWebWorker: false,
                  };
                  const compressedFile = await imageCompression(file, options);
                  resolve(compressedFile);
                } catch (error) {
                  reject(error);
                }
              })();
            },
            (error) => {
              reject(error);
            },
            {
              quality: 100,
              encodingType: navigator.camera.EncodingType.JPEG,
              sourceType: camera ? navigator.camera.PictureSourceType.CAMERA : navigator.camera.PictureSourceType.PHOTOLIBRARY,
              mediaType: navigator.camera.MediaType.PICTURE,
              allowEdit: Platform.is.android ? false : edit,
              destinationType: Camera.DestinationType.DATA_URL,
              correctOrientation: true,
            }
          );
        }
      });
    };
    let file;
    try {
      file = await getImg();
    } catch (e) {
      throw "Could not get picture";
    }
    try {
      let type = file.type;
      type = type.split("/").pop();
      this.$q.loading.show();
      const decodedImage = await imageCompression.getDataUrlFromFile(file);
      this.$q.loading.hide();
      return { base64: decodedImage, type };
    } catch (e) {
      this.$showError(e);
    }
  },
  $filterDropdown(val, update, data, filter) {
    if (!data.all) {
      data.all = Object.assign([], data.filter);
    }
    if (val === "") {
      update(() => {
        data.filter = Object.assign([], data.all);
      });
      return;
    }
    update(() => {
      const needle = val.toLowerCase();
      if (!filter) {
        filter = (v) => v.toLowerCase().indexOf(needle) > -1;
      }
      data.filter = Object.assign([], data.all.filter(filter));
    });
  },
  $timeSince(timeStamp) {
    const now = new Date();
    const secondsPast = (now.getTime() - timeStamp) / 1000;
    if (secondsPast < 60) {
      return "just now";
    }
    if (secondsPast < 3600) {
      return `${parseInt(secondsPast / 60)}m`;
    }
    if (secondsPast <= 86400) {
      return `${parseInt(secondsPast / 3600)}h`;
    }
    if (secondsPast > 86400) {
      const day = timeStamp.getDate();
      const month = timeStamp
        .toDateString()
        .match(/ [a-zA-Z]*/)[0]
        .replace(" ", "");
      const year = timeStamp.getFullYear() == now.getFullYear() ? "" : ` ${timeStamp.getFullYear()}`;
      return `${day} ${month}${year}`;
    }
  },
  $ParseVueObject(className, json = {}) {
    return new ParseVueObject(className, json);
  },
  $next(e, field) {
    if (!field || !e) {
      document.activeElement.blur();
      try {
        AndroidFullScreen.immersiveMode();
      } catch (e) {
        /* */
      }
      return;
    }
    let input = (() => {
      const checkResult = (refs) => {
        if (refs.$refs[field]) {
          return refs.$refs[field];
        }
        return checkResult(refs.$parent);
      };
      return checkResult(this);
    })();
    if (!input) {
      document.activeElement.blur();
      return;
    }
    if (Array.isArray(input)) {
      input = input[0];
    }
    while (input?.$refs?.input) {
      input = input.$refs.input;
    }
    input.$el.focus();
    e.preventDefault();
  },
  async $pagination(query, props, context) {
    const pagination = { ...props.pagination };
    query.limit(pagination.rowsPerPage + 1);
    query.skip((pagination.page - 1) * pagination.rowsPerPage);
    if (pagination.sortBy) {
      if (pagination.descending) {
        query.ascending(pagination.sortBy);
      } else {
        query.descending(pagination.sortBy);
      }
    } else {
      query.descending("createdAt");
    }
    const data = await query.find({ context });
    if (data.length === pagination.rowsPerPage + 1) {
      pagination.rowsNumber = pagination.page * pagination.rowsPerPage + 1;
    } else {
      pagination.rowsNumber = (pagination.page - 1) * pagination.rowsPerPage + data.length;
    }
    if (data.length === pagination.rowsPerPage + 1) {
      data.pop();
    }
    return { data, pagination };
  },
  async $copy(link) {
    await this.$resolve(copyToClipboard(link));
    this.$showMessage("Link copied to clipboard");
  },
  $formatDate(...args) {
    return date.formatDate(...args);
  },
  $openURL(...args) {
    return openURL(...args);
  },
  $extractDate(...args) {
    return date.extractDate(...args);
  },
};
