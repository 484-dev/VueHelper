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
        fileEntry => {
          fileEntry.file(
            file => {
              resolve(file);
            },
            err => {
              reject(err);
            }
          );
        },
        error => reject(error)
      );
    });
  },
  $getLocation() {
    if (navigator) {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve(position);
          },
          (error) => {
            reject(error);
          }
        );
      });
    }
    return {
      coords: {
        latitude: -37.813629,
        longitude: 144.963058,
      },
    };
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
};
