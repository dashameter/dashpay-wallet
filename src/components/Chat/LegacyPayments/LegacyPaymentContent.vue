<template>
  <!-- Received transaction -->
  <div
    v-if="transaction.type === 'received'"
    class="flex ion-no-wrap received_txn"
  >
    Received to 
    <div class="address">
      {{ truncatedAddress(transaction.to[0].address) }}
    </div>
  </div>

  <!-- Sent transaction -->
  <div
    v-if="transaction.type === 'sent' && transaction.to[0].address != 'false'"
    class="sent_txn flex ion-justify-content-end"
  >
    Sent to
    <div class="address">
      {{ truncatedAddress(transaction.to[0].address) }}
    </div>
  </div>

  <!-- Received and sent transaction chat bubbles -->
  <chat-small-txn
    v-if="
      transaction.type === 'received' ||
      (transaction.type === 'sent' && transaction.to[0].address != 'false')
    "
    :msg="{
      _direction: transaction.type,
      createdAt: new Date(transaction.time * 1000),
      data: {
        amount: transaction.to[0].satoshis,
        fiatAmount: duffsInDash(transaction.to[0].satoshis) * fiatRate,
        fiatSymbol: fiatSymbol,
      },
      state: transaction.isInstantLocked,
    }"
  ></chat-small-txn>

  <!-- Internal transfer or Topup  -->
  <div class="flex ion-justify-content-center">
    <div
      v-if="
        transaction.type === 'address_transfer' ||
        (transaction.type === 'sent' && transaction.to[0].address === 'false')
      "
      class="internal"
    >
      <!-- Internal transfer -->
      <div
        class="flex ion-no-wrap"
        :class="{
          internal_text: transaction.type === 'address_transfer',
          topup_text:
            transaction.type === 'sent' &&
            transaction.to[0].address === 'false',
        }"
      >
        <div v-if="transaction.type === 'address_transfer'">
          Internal Transfer of {{ internalTransferText }}
        </div>

        <!-- Identity TopUp -->
        <div
          v-if="
            transaction.type === 'sent' && transaction.to[0].address === 'false'
          "
        >
          Identity TopUp of {{ internalTransferText }}
        </div>
        <span class="space_between">
          <!-- TODO -->
        </span>
        {{ hours }}:{{ mins }}
      </div>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Dashcore = require("@dashevo/dashcore-lib");
const Unit = Dashcore.Unit;

import ChatSmallTxn from "@/components/Chat/ChatSmallTxn.vue";
import useRates from "@/composables/rates";
import useWallet from "@/composables/wallet";
import { ref, computed } from "vue";

export default {
  name: "ChatLegacyPayment",
  components: {
    ChatSmallTxn,
  },
  props: ["transaction"],
  setup(props) {
    const { fetchRate, getFiatSymbol, getFiatRate, duffsInDash, dashInDuffs } =
      useRates();

    const fiatSymbol = ref(getFiatSymbol.value);
    const fiatRate = ref(getFiatRate.value(getFiatSymbol.value).price);

    const truncatedAddress = function (address) {
      return (
        address.substring(0, 6) +
        "..." +
        address.substring(address.length - 6, address.length)
      );
    };

    const sentDash = computed(() => {
      return Unit.fromSatoshis(props.transaction.to[0].satoshis).toBTC();
    });

    const receivedDash = computed(() => {
      return Unit.fromSatoshis(props.transaction.to[0].satoshis).toBTC();
    });

    const internalTransferText = computed(() => {
      const dash = ref(duffsInDash.value(props.transaction.to[0].satoshis));
      const fiat = ref(
        (
          duffsInDash.value(props.transaction.to[0].satoshis) * fiatRate.value
        ).toFixed(2)
      );
      return (
        dash.value + " Dash (~" + fiat.value + " " + fiatSymbol.value + ")"
      );
    });

    const hours = computed(() =>
      new Date(props.transaction.time * 1000).getHours()
    );

    const mins = computed(() => {
      const time = ref(new Date(props.transaction.time * 1000));
      return ("0" + time.value.getMinutes()).slice(-2);
    });

    return {
      truncatedAddress,
      internalTransferText,
      sentDash,
      receivedDash,
      duffsInDash,
      fiatSymbol,
      fiatRate,
      mins,
      hours,
    };
  },
};
</script>

<style scoped>
.sent_txn {
  font-style: normal;
  font-weight: 600;
  font-size: 10px;
  line-height: 12px;
  color: #6a67fb;
  margin: 6px 2px 6px 0px;
}
.received_txn {
  font-style: normal;
  font-weight: 600;
  font-size: 10px;
  line-height: 12px;
  color: #34bba8;
  margin: 6px 0px 7px 3px;
}
.address {
  color: rgba(0, 0, 0, 0.4);
  margin-left: 3px;
  margin-right: 3px;
}
.internal {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px 0px;

  /* width: 262px; */
  height: 23px;

  background: #f3f3f5;
  border-radius: 10.5px;
  margin: 6px 0px;
}
.internal_text {
  font-style: normal;
  font-weight: 500;
  line-height: 13px;
  color: rgba(0, 0, 0, 0.4);
  font-size: 11px;

  flex: none;
  order: 0;
  flex-grow: 0;
  margin: 0px 13px;
}
.topup_text {
  font-style: normal;
  font-weight: 500;
  line-height: 12px;
  margin: 0px 13px;
  color: rgba(0, 0, 0, 0.4);
  font-size: 10px;
}
.space_between {
  margin-left: 13px;
  margin-right: 13px;
}
.dash {
  font-weight: 700;
  color: #66bda8;
}
</style>
