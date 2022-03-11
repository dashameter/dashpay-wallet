<template>
  <ion-item :account="account" class="ion-no-padding" button>
    <ion-avatar slot="start">
      <img
        :src="getUserAvatar(account.accountDPNS?.$ownerId)"
        :class="{ animate: areProfilesLoading }"
      />
    </ion-avatar>
    <ion-label class="ion-nowrap">
      <div style="position: relative">
        <ion-icon
          v-if="loggedInAccount"
          :src="require('/public/assets/icons/account.svg')"
        ></ion-icon>
        <h2 class="accountname">
          {{ accountLabel }}
        </h2>
        <h3 class="displayname">
          {{ accountDisplayName }}
        </h3>
      </div>
    </ion-label>
  </ion-item>
</template>

<script lang="ts">
import { IonLabel, IonItem, IonAvatar, IonIcon } from "@ionic/vue";

import { checkmark } from "ionicons/icons";

import { computed } from "vue";
import { useStore } from "vuex";

import useContacts from "@/composables/contacts";

export default {
  name: "AccountItem",
  props: ["account", "areProfilesLoading"],
  components: {
    IonLabel,
    IonItem,
    IonAvatar,
    IonIcon,
  },
  setup(props: any) {
    const store = useStore();
    const { getUserDisplayName, getUserAvatar } = useContacts();

    const loggedInAccount: any = computed(
      () =>
        props.account.accountDPNS &&
        props.account.accountDPNS?.$ownerId ===
          store.state.accountDPNS?.$ownerId
    );

    const accountLabel: any = computed(() => {
      if (props.account.accountDPNS) {
        return props.account.accountDPNS.label;
      } else {
        return props.account.wishName;
      }
    });

    const accountDisplayName: any = computed(() => {
      if (props.account.accountDPNS) {
        return getUserDisplayName.value(props.account.accountDPNS.$ownerId);
      } else {
        return "(unregistered)";
      }
    });

    return {
      accountDisplayName,
      accountLabel,
      getUserAvatar,
      loggedInAccount,
      checkmark,
    };
  },
};
</script>

<style scoped>
.accountname {
  font-style: normal;
  font-weight: bold;
  font-size: 14px;
  line-height: 18px;
  color: #000000;
}
.displayname {
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 15px;
  color: #929598;
}
.active {
  float: right;
  display: flex;
  height: 23px;
  width: 23px;
  position: absolute;
  top: 50%;
  right: 0px;
  transform: translate(0%, -50%);
}
.animate {
  animation: shimmer 2s infinite;
  background: linear-gradient(to right, #cacaca 4%, #e2e2e2 25%, #eff1f3 36%);
  background-size: 400px 100%;
}
@keyframes shimmer {
  0% {
    background-position: -400px 0;
  }
  100% {
    background-position: 400px 0;
  }
}
</style>
