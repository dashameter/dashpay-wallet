<template>
  <ion-toast
    :css-class="store.state.toast.type"
    part="message button"
    position="top"
    :buttons="showButton()"
    :is-open="store.state.toast.isOpen"
    :message="store.state.toast.text"
    :duration="1500"
    @didDismiss="closeToast"
  >
  </ion-toast>
</template>

<script lang="ts">
import { watch, computed } from "vue";
import { useStore } from "vuex";
import { IonToast } from "@ionic/vue";
import { defineComponent } from "vue";
import { copy, checkmarkCircleOutline } from "ionicons/icons";

export default defineComponent({
  components: {
    IonToast,
  },
  setup() {
    const store = useStore();

    const toastColor = computed(() => store.state.toast.color || "medium");

    watch(
      () => store.state.toast.timestamp,
      () => {
        store.commit("setToastOpenState", true);
        console.log("copy toast state", store.state.toast.isOpen);
      }
    );

    const showButton = function () {
      if (store.state.toast.icon === "copyIcon") {
        return [
          {
            side: "start",
            icon: copy,
            cssClass: "copiedtoast",
          },
        ];
      } else if (store.state.toast.icon === "transactionIcon") {
        return [
          {
            side: "start",
            icon: checkmarkCircleOutline,
          },
        ];
      }
    };

    const closeToast = function () {
      store.commit("setToastOpenState", false);
      console.log("copy toast state closed", store.state.toast.isOpen);
    };

    return {
      copy,
      store,
      toastColor,
      closeToast,
      checkmarkCircleOutline,
      showButton,
    };
  },
});
</script>

<style>
/* ion-toast css-class only works if style is not scoped or if add to core.css */
/* works if class is named ion-toast or .copiedtoast */
.copiedtoast {
  --background: #818c99;
  --border-radius: 10px;
  --color: #ffffff;
  --button-color: #ffffff;
  display: flex;
  justify-content: center;
  text-align: center;
  margin: auto;
  height: 70px;
}

ion-toast::part(message) {
  margin-left: -22px;
}
/* ion-toast::part(button) {
  margin-left: calc(50% - 10px);
} */

.transactiontoast {
  --background: linear-gradient(
    266.51deg,
    #f3f3ff 0%,
    #e9f0ff 100%,
    #e9f0ff 100%
  );
  --border-radius: 10px;
  --color: #6c69fc;
  display: flex;
  justify-content: center;
  text-align: center;
  height: 70px;

  font-style: normal;
  font-weight: 600;
  font-size: 11px;
  line-height: 13px;
}
</style>
