<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <div class="flex ion-nowrap ion-padding-start ion-padding-vertical">
          <ion-icon
            :icon="closeOutline"
            class="close"
            @click="cancel"
          ></ion-icon>
          <div class="headername centerheader align">Dash address</div>
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <qrcode-vue :value="myLabel" size="280" level="H" class="center" />
      <div class="headername middle">
        {{ myLabel }}
        <ion-icon
          :icon="copyOutline"
          class="copyicon"
          @click="copyToClipboard()"
        ></ion-icon>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  modalController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import QrcodeVue from "qrcode.vue";

import { useRouter } from "vue-router";
import { useStore } from "vuex";

import { copyOutline, closeOutline } from "ionicons/icons";
import useContacts from "@/composables/contacts";

export default defineComponent({
  inheritAttrs: false,
  name: "ContactQRCodeModal",
  components: {
    QrcodeVue,
    IonContent,
    IonHeader,
    IonIcon,
    IonPage,
  },
  setup() {
    const store = useStore();
    const { myLabel } = useContacts();
    const router = useRouter();

    console.log("label", myLabel);

    function copyToClipboard() {
      navigator.clipboard.writeText("Xcu5iYBH...FHrFVdYu").then(
        function () {
          store.dispatch("showToast", {
            text: "Copied message text",
            type: "copiedtoast",
            icon: "copyIcon",
          });
        },
        function (err) {
          console.error("Could not copy text: ", err);
        }
      );
    }

    const cancel = () => {
      modalController.dismiss();
    };

    return {
      copyOutline,
      copyToClipboard,
      store,
      closeOutline,
      myLabel,
      router,
      cancel,
    };
  },
});
</script>

<style scoped>
.label {
  margin-top: 33px;
}
.align {
  margin-top: 14px;
}
.middle {
  position: fixed;
  left: 50%;
  bottom: 4%;
  transform: translate(-50%, 0%);
}
</style>