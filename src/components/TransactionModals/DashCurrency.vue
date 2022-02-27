<template>
  <div class="flex ion-nowrap wrapper">
    <ion-input
      ref="focus"
      class="enter-dash dash-width"
      v-on:input="$emit('update:amount', $event.target.value)"
      :value="amount"
      type="number"
      min="0"
      maxlength="9"
      placeholder="0.000"
      autofocus="true"
    ></ion-input>
    <ion-label class="dash-label"> Dash</ion-label>
  </div>
  <div class="flex ion-justify-content-center convert">
    {{ fiatAmount?.toFixed(2) }} {{ fiatSymbol || "USD" }}
    <ion-icon
      :icon="chevronDownOutline"
      class="fiat-icon"
      @click="showChooseCurrencyModal(true)"
    ></ion-icon>
  </div>
  <ion-modal
    :is-open="isChooseCurrencyModalOpen"
    @didDismiss="showChooseCurrencyModal(false)"
  >
    <ChooseCurrencyModal @chooseCurrency="chooseCurrency"></ChooseCurrencyModal>
  </ion-modal>
</template>

<script lang="ts">
import ChooseCurrencyModal from "@/components/Settings/ChooseCurrencyModal.vue";
import useRates from "@/composables/rates";
import { IonInput, IonIcon, IonModal, IonLabel } from "@ionic/vue";
import { chevronDownOutline } from "ionicons/icons";
import { onMounted } from "vue";

import { defineComponent, ref } from "vue";

export default defineComponent({
  props: ["amount", "fiatAmount", "fiatSymbol"],
  emits: ["update:amount", "newFiatRate", "newFiatSymbol"],
  components: {
    IonInput,
    IonIcon,
    IonModal,
    IonLabel,
    ChooseCurrencyModal,
  },
  setup(props: any, context: any) {
    const { fetchRate, getFiatRate } = useRates();
    const { duffsInDash } = useRates();

    const isChooseCurrencyModalOpen = ref(false);
    const focus = ref(null);

    onMounted(async () => {
      setTimeout(async () => {
        (focus.value as any).$el.setFocus();
      }, 1000);
    });
    
    const fiatRate = ref(getFiatRate.value(props.fiatSymbol).price);
    console.log("fiatRate.value :>> ", fiatRate.value);

    const chooseCurrency = async (symbol: string) => {
      context.emit("newFiatSymbol", symbol);
      // console.log("getFiatSymbol.value :>> ", getFiatSymbol.value);
      fiatRate.value = parseFloat((await fetchRate(symbol)).price);
      context.emit("newFiatRate", fiatRate.value);
    };

    const showChooseCurrencyModal = (state: boolean) => {
      isChooseCurrencyModalOpen.value = state;
    };

    return {
      chevronDownOutline,
      emit: context.emit,
      isChooseCurrencyModalOpen,
      fiatRate,
      chooseCurrency,
      showChooseCurrencyModal,
      duffsInDash,
      focus,
    };
  },
});
</script>

<style scoped>
.fiat-icon {
  order: 1;
  margin-left: 2px;
}
.input-wrap {
  position: relative;
  margin: auto;
  width: 250px;
}

/* remove the increment buttons from the ion-input field */
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
-webkit-appearance: none;
-moz-appearance: none;
appearance: none;
margin: 0;
opacity: 1;
}

/* firefox */
/* input[type=number] {
  -moz-appearance: textfield !important;
} */

/* this style deactivates the focus on the input field */
/* ion-input {
  --placeholder-font-weight: 500;
  --placeholder-color: black; 
  --placeholder-opacity: 0.7;
} */
</style>