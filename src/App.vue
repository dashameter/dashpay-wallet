<template>
  <ion-app>
    <ion-router-outlet />
    <Toast></Toast>
  </ion-app>
</template>

<script lang="ts">
import { IonApp, IonRouterOutlet } from "@ionic/vue";
import { defineComponent, onErrorCaptured } from "vue";
import Toast from "@/components/Chat/Toast.vue";

import { useStore } from "vuex";

export default defineComponent({
  name: "App",
  components: {
    IonApp,
    IonRouterOutlet,
    Toast,
  },
  setup() {
    // const client = getClient();

    // const clientIdentity = getClientIdentity();

    // const router = useRouter();

    const store = useStore();

    onErrorCaptured((error: any) => {
      console.error("onErrorCaptured", error);
      store.dispatch("showToast", { text: error, color: "danger" });
      return false;
    });

    window.onerror = function(msg, src, linenum, colnum, error) {
      console.error("window.onerror", error);
      store.dispatch("showToast", { text: `${msg} ${error}`, color: "danger" });
      return false;
    };
  },
});
</script>
