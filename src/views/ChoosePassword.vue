<template>
  <ion-page>
    <ion-content :fullscreen="true" class="ion-padding">
      <div class="flex ion-nowrap ion-padding-bottom">
        <ion-icon
          :icon="closeOutline"
          class="close"
          @click="router.push('choosename')"
        ></ion-icon>
        <div class="unlock">Choose Password</div>
      </div>

      <ion-avatar slot="start" class="avatar">
        <!-- <img :src="store.getters.getUserAvatar(pass in account chosen as prop)" /> -->
      </ion-avatar>

      <ion-item class="ion-margin-top password" lines="none">
        <form>
          <ion-input
            debounce="500"
            v-model="formPassword"
            enterkeyhint="next"
            placeholder="Enter password"
            show-clear-button="never"
            type="password"
            @keyup.enter="checkPassword()"
          >
          </ion-input>
        </form>
      </ion-item>
      <div>
        <ion-icon
          class="lock"
          :src="require('/public/assets/icons/unlock.svg')"
        />
      </div>
    </ion-content>
    <ion-footer class="ion-no-border">
      <!-- <ion-toolbar>
        <ion-title>{{ checkMessage }}</ion-title>
      </ion-toolbar> -->
      <ion-toolbar>
        <ion-chip
          expand="block"
          class="nextbutton next-color"
          @click="checkPassword()"
          ><span class="next-text">Next</span></ion-chip
        >
      </ion-toolbar>
    </ion-footer>
    <ion-loading :is-open="showLoader" :message="'Initializing Wallet'">
    </ion-loading>
  </ion-page>
</template>

<script lang="ts">
import { ref } from "vue";
import {
  IonPage,
  IonToolbar,
  IonContent,
  IonChip,
  IonAvatar,
  IonInput,
  IonItem,
  IonFooter,
  IonIcon,
  IonLoading,
  modalController,
} from "@ionic/vue";

import {
  getClient,
  disconnectClient,
  getClientOpts,
  initClient,
} from "@/lib/DashClient";

import { useRouter } from "vue-router";
import { useStore } from "vuex";
import useWallet from "@/composables/wallet";

import { storeAccount, createAccountId } from "@/lib/helpers/AccountStorage";

import { closeOutline } from "ionicons/icons";

// TODO remove for production
import LogRocket from "logrocket";

export default {
  name: "ChoosePassword",
  components: {
    IonToolbar,
    IonContent,
    IonPage,
    IonFooter,
    IonChip,
    IonInput,
    IonItem,
    IonIcon,
    IonAvatar,
    IonLoading,
  },
  setup() {
    const router = useRouter();

    const store = useStore();

    const { myBalance } = useWallet();

    const formPassword = ref("");

    const checkMessage = ref("");

    const { getUserLabel, getUserAvatar } = store.getters;

    const showLoader = ref(false);

    // onMounted(async () => {});

    const cancel = () => {
      modalController.dismiss();
    };

    const checkPassword = async () => {
      showLoader.value = true;
      console.log("store.state.wishName :>> ", store.state.wishName);
      console.log("formPassword.value :>> ", formPassword.value);

      try {
        await disconnectClient();
      } catch (e) {
        console.log(e);
      }
      const clientOpts = getClientOpts(null);

      await initClient(clientOpts);

      console.log(
        "getClient().wallet!.exportWallet() :>> ",
        getClient().wallet!.exportWallet()
      );

      const encMnemonic = getClient().account!.encrypt(
        "aes",
        getClient().wallet?.exportWallet(),
        formPassword.value
      );

      const accountId = createAccountId(
        getClient()
          .wallet!.exportWallet()
          .toString()
      );

      // TODO remove evil logging for production
      LogRocket.identify(accountId, {
        wishName: store.state.wishName,
        accountDPNS: store.state.accountDPNS,
      });

      await storeAccount({
        wishName: store.state.wishName,
        accountDPNS: store.state.accountDPNS,
        id: accountId,
        encMnemonic,
      });

      checkMessage.value = "Wallet saved on device";

      setTimeout(() => {
        // We recovered a mnemonic, we don't need to backup the mnemonic
        if (store.state.isMnemonicBackedUp) {
          // The recovered mnemonic already has a dpns entry, go straight to home screen
          if (store.getters.myLabel) router.push("/home");
          // The recovered mnemonic is missing an identity or dpns entry, finish registration or redeem invite first
          else if (myBalance.value > 1e5) {
            router.push("/finishregistration");
          } else {
            router.push("/redeeminvite");
          }
        }

        // We registered a new account, we must backup the mnemonic
        else {
          router.push("/backupmnemonic");
        }
        showLoader.value = false;
      }, 1200);
    };

    return {
      getUserLabel,
      getUserAvatar,
      formPassword,
      checkPassword,
      checkMessage,
      closeOutline,
      cancel,
      router,
      showLoader,
    };
  },
};
</script>

<style scoped>
.avatar {
  width: 85px;
  height: 85px;
}
ion-input {
  --padding-start: 12px; /* did not work, so used css class below */
  /* --width: 400px; */
  height: 45px;
  --background: #f5f5f7;
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  box-sizing: border-box;
  border-radius: 10px;
}
ion-item.sc-ion-input-md-h:not(.item-label),
ion-item:not(.item-label) .sc-ion-input-md-h {
  --padding-start: 12px;
  width: 296px;
}
.lock {
  position: absolute;
  left: 156px;
  top: 394px;
  width: 48px;
  height: 62px;
}
.password {
  margin-top: 150px;
}
</style>
