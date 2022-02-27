<template>
  <ion-header>
    <ion-toolbar>
        <div class="flex ion-nowrap ion-padding-start ion-padding-vertical">
          <ion-icon
            :icon="closeOutline"
            class="close"
            @click="cancel"
          ></ion-icon>
          <div class="flex ion-padding-start headername centerheader align">Dash address</div>
        </div>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding ion-justify-content-center">
    <qrcode-vue :value="label" size="190" level="H" class="center" />
      <div class="flex ion-nowrap ion-padding-bottom">
        <div class="headername middle">
          {{ label }}
          <ion-icon
            :icon="copyOutline"
            class="copyicon"
            @click="copyToClipboard()"
          ></ion-icon>
        </div>
      </div>
  </ion-content>
</template>

<script>
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonIcon,
  modalController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { useStore } from "vuex";
import QrcodeVue from "qrcode.vue";
import { copyOutline, closeOutline } from "ionicons/icons";

export default defineComponent({
  name: "ContactQRCodeModal",
  props: {
    label: { type: String, default: "" },
  },
  components: {
    IonContent,
    IonHeader,
    IonToolbar,
    IonIcon,
    QrcodeVue,
  },
  data() {
    return {
      closeOutline,
      copyOutline,
    };
  },
  methods: {
    cancel() {
      modalController.dismiss();
    },
  },
  setup(props) {
    const store = useStore();

    function copyToClipboard() {
      navigator.clipboard.writeText(props.label).then(
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
    
    return {
      copyToClipboard,
      store,
    }
  },
});
</script>

<style scoped>
.align {
  margin-top: 14px;
}

.middle {
  position: fixed;
  left: 50%;
  bottom: 8%;
  transform: translate(-50%, 0%);
}
</style>