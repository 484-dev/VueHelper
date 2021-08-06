import ParseVueObject from "./ParseVueSubclass";
import imageCompression from "browser-image-compression";
export default {
  $validateFields(...fields) {
    if (Array.isArray(fields[0])) {
      fields = fields[0];
    }
    try {
      let allowed = true;
      if (!this.$refs) {
        throw new Error("Please set refs.");
      }
      for (const field of fields) {
        const fd = this.$refs[field];
        if (!fd) {
          throw new Error(`this.$refs ${field} is not defined.`);
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
      return;
    }
    if (error.message) {
      error = error.message;
    }
    this.$q.notify({
      message: error,
      type: "error",
      duration: 2000,
    });
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
    this.$q.notify({
      message,
      type: "error",
      duration: 2000,
    });
  },
  async $resolve(promise) {
    if (!promise) {
      throw new Error("Please pass a promise.");
    }
    this.$q.loading.show();
    try {
      const result = await Promise.resolve(promise);
      this.$q.loading.hide();
      return result;
    } catch (e) {
      this.$q.loading.hide();
      this.$showError(e);
    }
  },
  $timeout(duration) {
    return new Promise((resolve) => setTimeout(resolve, duration));
  },
  $getFile(fileURL) {
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
  $getLocation() {
    const defaultPos = {
      coords: {
        latitude: -37.813629,
        longitude: 144.963058,
      },
    }
    if (navigator.geolocation) {
      return new Promise((resolve, reject) => {
        let resolved = false;
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(defaultPos)
          }
        }, 5000)
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve(position);
            resolved = true;
          },
          (error) => {
            reject(error);
            resolved = true;
          }
        );
      });
    }
    return defaultPos;
  },
  async $getPicture({ edit = true, camera = false } = {}) {
    const getImg = () => {
      return new Promise((resolve, reject) => {
        if (!navigator.camera) {
          const input = document.createElement("input");
          input.type = "file";

          input.onclick = () => {
            document.body.onfocus = () => {
              setTimeout(checkOnCancel, 100);
            };
          };

          const checkOnCancel = () => {
            if (input.value.length === 0) {
              reject("No file selected.");
              return;
            }
            resolve(input.files[0]);
            document.body.onfocus = null;
          };
          input.click();
        } else {
          navigator.camera.getPicture(
            (fileLocation) => {
              (async () => {
                try {
                  const file = await this.$getFile(fileLocation);
                  const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 800,
                    useWebWorker: false,
                  };
                  const compressedFile = await imageCompression(file, options);
                  resolve(compressedFile);
                } catch (e) {
                  reject(e);
                }
              })();
            },
            (error) => {
              reject(error);
            },
            {
              quality: 100,
              encodingType: navigator.camera.EncodingType.JPEG,
              sourceType: camera
                ? navigator.camera.PictureSourceType.CAMERA
                : navigator.camera.PictureSourceType.PHOTOLIBRARY,
              mediaType: navigator.camera.MediaType.PICTURE,
              allowEdit: edit,
            }
          );
        }
      });
    };
    try {
      this.$q.loading.show();
      const file = await getImg();
      const decodedImage = await imageCompression.getDataUrlFromFile(file);
      this.$q.loading.hide();
      return decodedImage;
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
      const year =
        timeStamp.getFullYear() == now.getFullYear()
          ? ""
          : ` ${timeStamp.getFullYear()}`;
      return `${day} ${month}${year}`;
    }
  },
  $ParseVueObject(className) {
    return new ParseVueObject(className);
  },
};
