<template>
  <q-page class="fullscreen findDiv q-ma-none">
    <q-tab-panels animated class="full-height bg-primary" v-model="tab">
      <q-tab-panel name="welcome" class="column full-height">
        <div class="row full-width col-grow justify-center items-center">
          <div class="row justify-center">
            <div
              :style="`height:20vh;width:20vh;background-image: url('${$appInfo.appIcon}') !important; background-repeat: no-repeat !important; background-position: center !important;background-size:cover !important;`"
            ></div>
            <h1
              class="col-10 text-white q-ma-none text-center text-bold"
              style="font-size: 5em"
            >
              {{ $appInfo.appName }}
            </h1>
            <h1
              class="col-10 text-white q-ma-none text-center text-bold"
              style="font-size: 1.2em"
              v-html="subtitle"
            ></h1>
          </div>
        </div>
        <div
          class="row self-end col-shrink full-width text-center justify-center"
        >
          <p class="col-10 text-white" @click="openTerms">
            By continuing you agree with<br /><u>Terms & Conditions</u>
          </p>
          <div class="row full-width justify-center q-px-sm q-pb-xl">
            <q-btn
              unelevated
              no-caps
              color="white"
              text-color="dark"
              label="Get started"
              class="col q-mr-xs"
              @click="
                (signup = true),
                  $slots.onboarding ? (tab = 'onboarding') : (tab = 'options')
              "
            ></q-btn>
            <q-btn
              unelevated
              no-caps
              color="dark"
              text-color="white"
              label="Login"
              class="col q-ml-xs"
              @click="(signup = false), (tab = 'options')"
            ></q-btn>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel
        name="onboarding"
        class="column full-height bg-primary"
        v-if="$slots.onboarding"
      >
        <div class="row full-width col-grow justify-center items-center">
          <div class="row full-width justify-center">
            <q-btn
              class="absolute-top-left q-mt-lg q-ml-md"
              unelevated
              icon="arrow_back"
              text-color="white"
              @click="tab = 'welcome'"
            ></q-btn>
            <slot name="onboarding"></slot>
            <q-btn
              unelevated
              no-caps
              color="white"
              text-color="black"
              label="Let's go"
              class="col-10 q-ma-sm"
              @click="tab = 'options'"
            ></q-btn>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="options" class="column full-height bg-dark">
        <div class="row full-width col-grow justify-center items-center">
          <div class="row full-width justify-center">
            <q-btn
              class="absolute-top-left q-mt-lg q-ml-md"
              unelevated
              icon="arrow_back"
              text-color="white"
              @click="tab = 'welcome'"
            ></q-btn>
            <q-btn
              unelevated
              no-caps
              color="white"
              text-color="black"
              label="Sign in with Apple"
              class="col-10 q-ma-sm"
            ></q-btn>
            <q-btn
              unelevated
              no-caps
              text-color="white"
              :label="`${signup ? 'Signup' : 'Login'} with Facebook`"
              class="col-10 q-ma-sm"
              style="background-color: #3b5998"
            ></q-btn>
            <p class="col-12 text-white q-ma-md text-center">OR</p>
            <q-btn
              unelevated
              no-caps
              color="primary"
              text-color="white"
              :label="`${signup ? 'Signup' : 'Login'} with email`"
              class="col-10 q-ma-sm"
              @click="tab = 'signup'"
            ></q-btn>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="signup" class="column full-height scroll-y bg-primary">
        <div class="row full-width col-grow justify-center items-center">
          <div class="row full-width justify-center">
            <q-btn
              class="absolute-top-left q-mt-lg q-ml-md"
              unelevated
              icon="arrow_back"
              text-color="white"
              @click="(tab = 'options'), (email = ''), (password = '')"
            ></q-btn>
            <h3
              class="col-10 text-white q-ma-none text-center text-bold"
              style="font-size: 2em"
            >
              {{ tagline }}
            </h3>
            <q-input
              dark
              color="white"
              class="col-10 q-mt-lg"
              v-model="email"
              label="Email Address"
              type="email"
              ref="email"
              :rules="[(val) => !!val || 'Please enter your email address']"
              lazy-rules
            ></q-input>
            <q-input
              dark
              color="white"
              class="col-10"
              v-model="password"
              label="Password"
              :type="isPwd ? 'password' : 'text'"
              ref="password"
              :rules="[(val) => !!val || 'Please enter your password']"
              lazy-rules
            >
              <template v-slot:append>
                <q-icon
                  :name="isPwd ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isPwd = !isPwd"
                />
              </template>
            </q-input>
            <div v-if="signup" class="col-10">
              <q-input
                dark
                color="white"
                class="col-10"
                ref="firstName"
                v-model="firstName"
                label="First Name"
                :rules="[(val) => !!val || 'Please enter your First Name']"
                lazy-rules
              >
              </q-input>
              <q-input
                dark
                color="white"
                class="col-10"
                ref="lastName"
                v-model="lastName"
                label="Last Name"
                :rules="[(val) => !!val || 'Please enter your Last Name']"
                lazy-rules
              >
              </q-input>
            </div>
            <q-btn
              unelevated
              no-caps
              color="dark"
              text-color="white"
              :label="`${signup ? 'Signup' : 'Login'}`"
              class="col-10 q-ma-sm q-mt-xl"
              @click="go"
            />
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script>
import ParseUser from "../utils/ParseUserSubclass";
import { openURL } from "quasar";
export default {
  name: "Login",
  data: function () {
    return {
      tab: "welcome",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      isPwd: true,
      signup: false,
    };
  },
  mounted() {},
  methods: {
    async go() {
      const fieldsToValidate = this.signup
        ? ["email", "password", "firstName", "lastName"]
        : ["email", "password"];
      this.$validateFields(fieldsToValidate);
      if (this.signup) {
        let user = new ParseUser();
        user.set("email", this.email);
        user.set("username", this.email);
        user.set("password", this.password);
        user.set("firstName", this.firstName);
        user.set("lastName", this.lastName);
        await this.$resolve(user.signUp());
        this.$router.push({ name: "welcome" });
        return;
      }
      await this.$resolve(ParseUser.logIn(this.email, this.password));
      await this.$fetchIfNeeded(true);
      const getPath = () => {
        const accType = ParseUser.current().get("accType");
        if (!accType) {
          return "welcome";
        }
        const required = this.requiredKeys[accType];
        if (!required) {
          this.$showError(`Keys not specified for accountType: ${accType}`);
        }
        for (const key of required) {
          if (!ParseUser.current().get(key)) {
            return "welcome";
          }
        }
        return accType;
      };
      this.$router.push({ name: getPath() });
    },
    openTerms() {
      openURL(this.$appInfo.terms);
    },
    notify: function () {
      this.$q.notify("Running on Quasar v" + this.$q.version);
    },
  },
  props: {
    subtitle: {
      type: String,
      required: true,
    },
    tagline: {
      type: String,
    },
    requiredKeys: {
      type: Object,
    }
  },
};
</script>