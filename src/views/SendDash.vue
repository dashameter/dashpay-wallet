<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="flex ion-nowrap ion-padding-bottom">
        <ion-icon
          :icon="closeOutline"
          class="close"
          @click="router.push(`/legacy`)"
        ></ion-icon>
        <!-- <ion-icon :icon="closeOutline" class="close" @click="cancel"></ion-icon> -->
        <div class="title purple flex ion-nowrap">
          <ion-icon
            class="header-icon"
            :src="require('/public/assets/icons/sendHeader.svg')"
          />
          Send Dash
        </div>
      </div>

      <div class="transaction">
        <MySelf
          :sendRequestDirection="'send'"
          :newDashBalance="newDashBalance"
        ></MySelf>
      </div>

      <span class="funds" v-if="newDashBalance < 0"
        >Not enough funds to send this transaction.</span
      >

      <div class="swap-container">
        <dash-currency
          @newFiatSymbol="fiatSymbol = $event"
          @newFiatRate="fiatRate = $event"
          v-if="currency === 'dash'"
          v-model:amount="amount"
          :amount="amount"
          :fiatAmount="fiatAmount"
          :fiatSymbol="fiatSymbol"
        >
        </dash-currency>
        <fiat-currency
          @newFiatSymbol="fiatSymbol = $event"
          @newFiatRate="fiatRate = $event"
          v-if="currency === 'fiat'"
          v-model:fiatAmount="fiatAmount"
          :fiatAmount="fiatAmount"
          :amount="amount"
          :fiatSymbol="fiatSymbol"
        ></fiat-currency>

        <ion-icon
          class="swap"
          @click="swapCurrency"
          :src="require('/public/assets/icons/swap_currency.svg')"
        ></ion-icon>
      </div>

      <div class="message-text">Recipient Dash Address</div>
      <textarea class="message-input" v-model="recipient" rows="2"></textarea>
    </ion-content>

    <ion-footer class="ion-no-border">
      <ion-chip
        v-if="newDashBalance >= 0"
        expand="block"
        shape="round"
        class="nextbutton next-color"
        @click="sendDash() && router.push('/home')"
        ><span class="next-text">Send</span></ion-chip
      >
      <ion-chip
        v-if="newDashBalance < 0"
        expand="block"
        shape="round"
        class="nextbutton next-color"
        disabled="true"
        ><span class="next-text">Send</span></ion-chip
      >
    </ion-footer>
  </ion-page>
</template>

<script lang="ts">
import DashCurrency from "@/components/TransactionModals/DashCurrency.vue";
import FiatCurrency from "@/components/TransactionModals/FiatCurrency.vue";
import MySelf from "@/components/TransactionModals/MySelf.vue";

import { ref, computed, defineComponent, watchEffect } from "vue";
import { useRouter } from "vue-router";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Unit } = require("@dashevo/dashcore-lib");

import {
  IonPage,
  IonFooter,
  IonContent,
  IonIcon,
  // IonTextarea,
  IonChip,
  modalController,
} from "@ionic/vue";
import { useStore } from "vuex";

import {
  chevronDownOutline,
  arrowDownOutline,
  closeOutline,
} from "ionicons/icons";

import { initClient, getClient } from "@/lib/DashClient";
import { Client } from "dash/dist/src/SDK/Client/index";

import useRates from "@/composables/rates";

export default defineComponent({
  name: "SendDash",
  components: {
    IonFooter,
    IonPage,
    IonContent,
    IonIcon,
    // IonTextarea,
    IonChip,
    // IonToast,
    DashCurrency,
    FiatCurrency,
    MySelf,
  },
  setup() {
    const router = useRouter();
    const store = useStore(); //FIXME store type

    const amount = ref(0);
    const fiatAmount = ref(0);

    const { getFiatSymbol, getFiatRate, duffsInDash, dashInDuffs } = useRates();

    const fiatSymbol = ref(getFiatSymbol.value);
    const fiatRate = ref(getFiatRate.value(getFiatSymbol.value).price);

    const client: Client = getClient();

    const account = client.account as any;

    const balance = ref<number>(account?.getTotalBalance());

    // const amount = ref<number>();

    const recipient = ref<string>(account?.getUnusedAddress().address);

    const transactionId = ref<string>();

    const isOpenRef = ref(false);

    const sendRequestDirection = ref("send");

    const switchSendRequest = () => {
      sendRequestDirection.value =
        sendRequestDirection.value === "send"
          ? (sendRequestDirection.value = "request")
          : (sendRequestDirection.value = "send");
    };

    const setOpen = (state: boolean) => (isOpenRef.value = state);

    const sendDash = async function () {
      const satoshis = Unit.fromBTC(amount.value).toSatoshis();

      const transaction = account.createTransaction({
        recipient: recipient.value,
        satoshis,
      });
      console.log("transaction :>> ", transaction);

      console.log("transactionId :>> ", transactionId);
      transactionId.value = await account.broadcastTransaction(transaction);
      console.log("transactionId :>> ", transactionId);

      console.log("transactionId :>> ", transactionId);

      setOpen(true);

      store.dispatch("showToast", {
        text: `Your transaction has been successfully sent.`,
        // text: `Your transaction has been successfully sent (Id: ${transactionId.value})`,
        type: "transactiontoast",
        icon: "transactionIcon",
      });
    };

    const currency = ref("dash");
    const swapCurrency = () => {
      currency.value =
        currency.value === "dash"
          ? (currency.value = "fiat")
          : (currency.value = "dash");
      console.log("show currency", currency.value);
    };

    watchEffect(() => {
      if (currency.value === "dash") {
        return (fiatAmount.value = amount.value * fiatRate.value);
      }
      if (currency.value === "fiat") {
        return (amount.value = fiatAmount.value / fiatRate.value);
      }
    });

    const newDashBalance = computed(() => {
      const bal = balance.value - dashInDuffs.value(amount.value);
      return duffsInDash.value(bal);
    });

    const cancel = () => {
      modalController.dismiss();
    };

    // onMounted(async () => {});

    return {
      balance,
      recipient,
      amount,
      transactionId,
      sendDash,
      isOpenRef,
      setOpen,
      chevronDownOutline,
      arrowDownOutline,
      closeOutline,
      newDashBalance,
      cancel,
      swapCurrency,
      fiatAmount,
      fiatSymbol,
      fiatRate,
      currency,
      router,
      store,
      switchSendRequest,
      sendRequestDirection,
    };
  },
});
</script>

<style scoped>
.transaction {
  border-radius: 10px;
  padding-top: 25px;
  margin-left: -10px;
  background-color: linear-gradient(266.73deg, #f2f8fd 0%, #ebfff8 98.09%);
}

ion-item::part(native) {
  background: linear-gradient(
    266.51deg,
    #f3f3ff 0%,
    #e9f0ff 100%,
    #e9f0ff 100%
  );
  margin: 25px 0px 0px 10px;
  border-radius: 10px;
  width: 328px;
}


.title {
  position: fixed;
  left: 50%;
  transform: translate(-50%, -50%);
  margin-top: 14px;
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  line-height: 19px;
  text-transform: capitalize;
  display: flex;
  align-items: center;
}
.header-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: flex-start;
  margin-right: 8px;
}
.swap-container {
  position: relative;
  margin-top: 70px;
}
.message-text {
  margin: 65px 0px 8px 0px;
  font-style: normal;
  font-weight: normal;
  font-size: 14px;
  line-height: 18px;
  color: #a3a3a3;
}
.message-input {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  min-height: 44px;

  background: #f5f5f7;

  border: 0.5px solid rgba(0, 0, 0, 0.12);
  /* box-sizing: border-box; */
  border-radius: 10px;
  min-width: 332px;
  font-size: 16px; 
  padding: 8px;
}
.swap {
  width: 35px;
  height: 35px;
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translate(0%, -50%);
}

textarea .native-textarea .sc-ion-textarea-md-h {
  min-width: 328px;
  --padding-top: 10px;
  --padding-end: 10px;
  --padding-bottom: 11px;
  --padding-start: 8px;
}

</style>
