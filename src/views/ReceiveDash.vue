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
        <div class="title green flex ion-nowrap">
          <ion-icon
            class="header-icon"
            :src="require('/public/assets/icons/requestHeader.svg')"
          />
          Receive Dash
        </div>
      </div>

      <div class="transaction inflow" part="native">
        <MySelf
          :sendRequestDirection="'request'"
          :newDashBalance="newDashBalance"
        ></MySelf>
      </div>

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
          @click="swapCurrency()"
          :src="require('/public/assets/icons/swap_currency.svg')"
        ></ion-icon>
      </div>

      <qrcode-vue
        :value="`${unusedAddress}?amount=${amount}`"
        size="260"
        level="H"
        class="center"
        @click="copyToClipboard()"
      />
      <div class="message-text">
        <ion-textarea
        :value="unusedAddress"
          readonly
        ></ion-textarea>
        <!-- :value="amount == 0 ? unusedAddress : `${unusedAddress}?amount=${amount}`" -->
      </div>
    </ion-content>
  </ion-page>
</template>


<script lang="ts">
import useContacts from "@/composables/contacts";
import useWallet from "@/composables/wallet";
import { getClient } from "@/lib/DashClient";
import { useStore } from "vuex";
import QrcodeVue from "qrcode.vue";
import { useRouter } from "vue-router";

import DashCurrency from "@/components/TransactionModals/DashCurrency.vue";
import FiatCurrency from "@/components/TransactionModals/FiatCurrency.vue";
import MySelf from "@/components/TransactionModals/MySelf.vue";

// import { IonContent, IonIcon, modalController } from "@ionic/vue";
import { IonPage, IonContent, IonIcon, IonTextarea } from "@ionic/vue";
import { defineComponent, ref, watchEffect, computed } from "vue";

import useRates from "@/composables/rates";

import { Client } from "dash/dist/src/SDK/Client/index";

import {
  chevronDownOutline,
  arrowDownOutline,
  closeOutline,
} from "ionicons/icons";

export default defineComponent({
  components: {
    IonPage,
    IonIcon,
    IonContent,
    DashCurrency,
    FiatCurrency,
    QrcodeVue,
    IonTextarea,
    MySelf,
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    const { getFiatSymbol, getFiatRate, duffsInDash, dashInDuffs } = useRates();

    const client: Client = getClient();
    const account = client.account as any;

    const amount = ref(0);

    const fiatAmount = ref(0);
    const fiatSymbol = ref(getFiatSymbol.value);
    const fiatRate = ref(getFiatRate.value(getFiatSymbol.value).price);

    const unusedAddress = ref<number>(account?.getUnusedAddress().address);

    console.log("fiat symbol", fiatSymbol.value);

    const sendRequestDirection = ref("request");

    function copyToClipboard() {
      navigator.clipboard.writeText(unusedAddress.value.toString()).then(
        function () {
          store.dispatch("showToast", {
            text: "Copied address",
            type: "copiedtoast",
            icon: "copyIcon",
          });
        },
        function (err) {
          console.error("Could not copy text: ", err);
        }
      );
    }

    const {
      getUserLabel,
      getUserAvatar,
      getUserDisplayName,
      getUserPublicMessage,
      myLabel,
      myAvatar,
      myOwnerId,
    } = useContacts();

    const { myBalance } = useWallet();

    const switchSendRequest = () => {
      sendRequestDirection.value =
        sendRequestDirection.value === "send"
          ? (sendRequestDirection.value = "request")
          : (sendRequestDirection.value = "send");
    };

    const currency = ref("dash");
    const swapCurrency = () => {
      currency.value =
        currency.value === "dash"
          ? (currency.value = "fiat")
          : (currency.value = "dash");
      console.log("show currency", currency.value);
    };

    const fiatValue = ref()
    watchEffect(() => {
      if (currency.value === "dash") {
        return (fiatAmount.value = parseFloat((amount.value * fiatRate.value).toFixed(2)));
      }
      if (currency.value === "fiat") {
        return (amount.value = parseFloat((fiatAmount.value / fiatRate.value).toFixed(6)));
      }
    });

    const newDashBalance = computed(() => {
      const balance = ref(0);
      balance.value = myBalance.value + dashInDuffs.value(amount.value);
      return duffsInDash.value(balance.value);
    });

    // const cancel = () => {
    //   modalController.dismiss();
    // };

    return {
      getUserLabel,
      getUserAvatar,
      getUserDisplayName,
      getUserPublicMessage,
      myLabel,
      myAvatar,
      myOwnerId,
      myBalance,
      switchSendRequest,
      swapCurrency,
      amount,
      fiatAmount,
      fiatRate,
      currency,
      sendRequestDirection,
      chevronDownOutline,
      arrowDownOutline,
      closeOutline,
      fiatSymbol,
      newDashBalance,
      balanceDash: computed(() => duffsInDash.value(myBalance.value)),
      copyToClipboard,
      unusedAddress,
      router,
      // cancel,
    };
  },
});
</script>


<style scoped>
.transaction {
  border-radius: 10px;
  background: white;
}

ion-item::part(native) {
  background: linear-gradient(266.73deg, #f2f8fd 0%, #ebfff8 98.09%);
  margin: 25px auto 0px;
  border-radius: 10px;
  width: 272px;
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
  /* order: 0; */
  width: 28px;
  height: 28px;
  display: flex;
  align-items: flex-start;
  margin-right: 8px;
}
.swap-container {
  position: relative;
  margin-top: 36px;
}
.swap {
  width: 35px;
  height: 35px;
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translate(0%, -50%);
}
.new-balance {
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 15px;
  color: #a3a3a3;
}
.red {
  color: #ff627e;
}
.center {
  position: fixed;
  left: 50%;
  transform: translate(-50%, 10%);
}
.message-text {
  margin: 300px 0px 8px 0px;
  padding: 0;
  font-style: normal;
  font-weight: normal;
  font-size: 14px;
  line-height: 18px;
  color: #a3a3a3;
  text-align: center;
}
</style>