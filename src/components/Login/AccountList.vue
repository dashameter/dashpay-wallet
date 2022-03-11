<template>
  <ion-list class="ion-no-padding">
    <ion-list-header class="accounts ion-no-padding ion-align-items-center"
      >Accounts</ion-list-header
    >
    <!-- <ion-modal
      :is-open="isAccountItemOpen"
      @didDismiss="showAccountItem(false)"
    > -->
    <AccountItem
      v-for="account in accounts"
      :key="account.encMnemonic"
      :account="account"
      :areProfilesLoading="areProfilesLoading"
      @click="$emit('selectAccount', account)"
    />
    <!-- </ion-modal> -->
  </ion-list>
</template>

<script lang="ts">
import { onMounted, onActivated, onRenderTriggered, ref } from "vue";

import { useRouter } from "vue-router";

import { IonList, IonListHeader } from "@ionic/vue";

import { getAccounts } from "@/lib/helpers/AccountStorage";

import AccountItem from "./AccountItem.vue";
import { useStore } from "vuex";
import { getClientOpts, initClient, getClient } from "@/lib/DashClient";

export default {
  name: "AccountList",
  components: {
    IonList,
    AccountItem,
    IonListHeader,
    // IonModal,
  },
  setup() {
    const router = useRouter();
    const isAccountItemOpen = ref(false);

    const showAccountItem = async (state = true) => {
      isAccountItemOpen.value = state;
    };

    const accounts = ref([]);

    const areProfilesLoading = ref(true);

    const store = useStore();

    const refreshAccountList = async () => {
      accounts.value = await getAccounts();

      if (accounts.value === null) {
        router.replace("/welcome");
        return;
      }

      const ownerIds = Object.entries(accounts.value)
        .filter((x: any) => (x[1] as any).accountDPNS?.$ownerId)
        .map((x: any) => (x[1] as any).accountDPNS.$ownerId);

      console.log("account ownerIds", ownerIds);

      await store.dispatch("fetchDashpayProfiles", {
        ownerIds,
        forceRefresh: true,
      });
      areProfilesLoading.value = false;
    };

    onMounted(async () => {
      // TODO onMounted is not called after signing up a new account and open the the account switcher via the avatar menu
      console.log("AccountList onMounted");

      try {
        getClient();
      } catch (e) {
        // If no client is initialized, init one without a wallet so we can fetch the dashpayProfiles
        const clientOpts = getClientOpts(undefined);
        await initClient(clientOpts);
      }

      refreshAccountList();
    });

    return {
      accounts,
      isAccountItemOpen,
      showAccountItem,
      areProfilesLoading,
    };
  },
};
</script>

<style scoped>
.accounts {
  /* font-family: Inter; */
  font-style: normal;
  font-weight: normal;
  font-size: 14px;
  line-height: 17px;
  color: #636363;
  display: flex;
  align-items: flex-end;
}
</style>
