<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="ion-no-border">
        <ion-buttons slot="start"
          ><ion-icon
            v-if="isLoggedIn"
            class="back"
            :icon="arrowBack"
            @click="router.push('/home')"
          ></ion-icon
        ></ion-buttons>
        <ion-title class="headername">Login</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding-start">
      <AccountList @selectAccount="selectAccount" />
      <ion-modal :is-open="isAccountOpen" @didDismiss="showAccountModal(false)">
        <PasswordPromptModal
          v-model="password"
          :account="selectedAccount"
          @decryptMnemonic="decryptMnemonic"
        />
      </ion-modal>
    </ion-content>
    <ion-footer class="ion-no-border ion-padding-horizontal ion-padding-bottom">
      <div>
        <div class="newaccount" @click="createAccount">
          <ion-icon
            :src="require('/public/assets/icons/newaccount.svg')"
            class="add"
          ></ion-icon>
          Create new account
        </div>
        <div class="newaccount" @click="addAccount">
          <ion-icon
            :src="require('/public/assets/icons/addwallet.svg')"
            class="add"
          ></ion-icon>
          Add an existing wallet
        </div>
      </div>
      <ion-toolbar v-if="isLoggedIn">
        <div class="flex ion-nowrap ion-align-items-center" @click="logout">
          <ion-icon
            :src="require('/public/assets/icons/logout.svg')"
            class="logout"
          ></ion-icon>
          <div class="logout-text">Log out</div>
        </div>
      </ion-toolbar>
    </ion-footer>
    <ion-loading :is-open="showLoader" :message="'Initializing Wallet'">
    </ion-loading>
  </ion-page>
</template>

<script lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";

import AccountList from "@/components/Login/AccountList.vue";
// import PasswordPrompt from "@/components/Login/PasswordPrompt.vue";
import PasswordPromptModal from "@/components/Login/PasswordPromptModal.vue";

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  // IonButton,
  IonButtons,
  IonFooter,
  IonModal,
  IonLoading,
} from "@ionic/vue";

import {
  getClient,
  getClientOpts,
  initClient,
  disconnectClient,
} from "@/lib/DashClient";

import { Client } from "dash/dist/src/SDK/Client/index";
import LogRocket from "logrocket";

import { arrowBack } from "ionicons/icons";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const decrypt = require("@dashevo/wallet-lib/src/types/Account/methods/decrypt");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  name: "ChooseAccount",
  components: {
    AccountList,
    PasswordPromptModal,
    IonButtons,
    // IonButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonPage,
    // IonButton,
    IonFooter,
    IonModal,
    IonLoading,
  },
  setup() {
    const router = useRouter();

    const store = useStore();

    const isAccountOpen = ref(false);

    let client: Client;

    const password = ref("");

    const accounts = ref([]);

    const selectedAccount = ref();

    const showLoader = ref(false);

    const showAccountModal = (state: boolean) => (isAccountOpen.value = state);

    function selectAccount(account: any) {
      store.commit("resetStateKeepDashpayProfiles");

      try {
        disconnectClient();
      } catch (e) {
        console.log("no client connected");
      }

      selectedAccount.value = account;

      // TODO remove evil logging for production
      LogRocket.identify(account.id, {
        label: account.accountDPNS?.label,
        accountDPNS: store.state.accountDPNS,
      });

      console.log("selectedAccount.value :>> ", selectedAccount.value);

      store.commit("setWishName", account.wishName);

      showAccountModal(true);
    }

    const recoverWallet = async (mnemonic: string) => {
      console.log("recover wallet");

      try {
        await disconnectClient();
      } catch (e) {
        console.log(e);
      }

      const clientOpts = getClientOpts(mnemonic);

      client = await initClient(clientOpts);

      console.log(
        "logged in with mnemonic :>> ",
        client?.wallet?.exportWallet()
      );

      const account = client.account as any;

      const balance = client.account!.getTotalBalance();

      console.log("balance :>> ", balance);

      console.log(
        "client.wallet.exportWallet() :>> ",
        client.wallet?.exportWallet()
      );

      console.log("logging in from localStorage");
      console.log("selectedAccount.value :>> ", selectedAccount.value);

      const [identityId] = await account.identities.getIdentityIds();

      // const identityId = selectedAccount.value.accountDPNS.$ownerId; // TODO TEMP this is a work around for slow testnet

      console.log("identityId :>> ", identityId);

      if (identityId) {
        const [dpnsDoc] = await client.platform?.names.resolveByRecord(
          "dashUniqueIdentityId",
          identityId
        );

        console.log("dpnsDoc :>> ", dpnsDoc?.toJSON());

        if (dpnsDoc) {
          store.commit("setAccountDPNS", dpnsDoc.toJSON());
          store.commit("setDPNS", dpnsDoc);
          store.commit("resetStateKeepAccountDPNS");

          store.dispatch("loadLastSeenChatTimestamps");
          store.dispatch("fetchDashpayProfiles", {
            ownerIds: [store.state.accountDPNS.$ownerId],
          });

          router.push("/home");
        } else {
          router.push("/finishregistration");
        }
      } else {
        if (balance > 0) {
          router.push("/finishregistration");
        } else {
          router.push("/redeeminvite");
        }
      }
      selectedAccount.value = undefined;
    };

    const decryptMnemonic = async function() {
      showLoader.value = true;
      await sleep(250); // Don't block viewport with the decrypt function
      const mnemonic = decrypt(
        "aes",
        selectedAccount.value.encMnemonic,
        password.value
      );

      console.log("mnemonic :>> ", mnemonic);
      await recoverWallet(mnemonic);
      showAccountModal(false);
      showLoader.value = false;
    };

    const createAccount = async () => {
      store.commit("resetStateKeepDashpayProfiles");

      try {
        getClient();
        if (getClient().wallet) await disconnectClient();
      } catch (e) {
        const clientOpts = getClientOpts(undefined);

        await initClient(clientOpts);
      }

      router.push("/choosename");
    };

    const addAccount = async () => {
      store.commit("resetStateKeepDashpayProfiles");

      try {
        await disconnectClient();
      } catch (e) {
        console.log(e);
      }

      router.push("/recoverwallet");
    };
    const logout = () => {
      store.commit("resetStateKeepDashpayProfiles");
      disconnectClient();
    };

    const isLoggedIn = computed(() => !!store.state.accountDPNS);

    return {
      isLoggedIn,
      logout,
      recoverWallet,
      router,
      accounts,
      selectedAccount,
      selectAccount,
      password,
      decryptMnemonic,
      arrowBack,
      createAccount,
      addAccount,
      isAccountOpen,
      showAccountModal,
      showLoader,
    };
  },
};
</script>

<style scoped>
ion-header {
  padding-left: 0px;
  background-color: #ffffff;
  border: none;
}

ion-toolbar {
  --background: primary;
}
.newaccount {
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  letter-spacing: -0.003em;
  color: #000000;
  display: flex;
  align-items: center;
  margin-top: 20px;
}
.add {
  height: 25px;
  width: 25px;
  /* display: flex;
  align-items: center; */
  margin-right: 13px;
}
.logout {
  height: 29px;
  width: 29px;
  margin-left: 3px;
}
.logout-text {
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  letter-spacing: -0.003em;
  color: #6c69fc;
  margin-left: 10px;
}
</style>
