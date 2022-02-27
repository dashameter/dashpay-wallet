<template>
  <div class="flex ion-nowrap wrapper">
    <ion-input
      ref="focus"
      class="enter-dash fiat-width"
      v-on:input="$emit('update:fiatAmount', $event.target.value)"
      type="number"
      min="0"
      :value="fiatAmount"
      placeholder="0.00"
    ></ion-input>
    <ion-label class="dash-label">
      {{ fiatSymbol }}
      <ion-icon
        :icon="chevronDownOutline"
        class="chevron"
        @click="showChooseCurrencyModal(true)"
      ></ion-icon>
    </ion-label>
  </div>
  <div class="flex ion-justify-content-center convert">
    {{ amount?.toFixed(6) }} Dash
  </div>
  <ion-modal
    :is-open="isChooseCurrencyModalOpen"
    @didDismiss="showChooseCurrencyModal(false)"
  >
    <ChooseCurrencyModal
      @chooseCurrency="chooseCurrency"
      :symbol="fiatSymbol"
    ></ChooseCurrencyModal>
  </ion-modal>
</template>

<script lang="ts">
import ChooseCurrencyModal from "@/components/Settings/ChooseCurrencyModal.vue";
import useRates from "@/composables/rates";
import { IonInput, IonIcon, IonModal, IonLabel } from "@ionic/vue";
import { chevronDownOutline } from "ionicons/icons";
import { onMounted } from "vue";

import { defineComponent, ref } from "vue";
// import { defineComponent, ref } from "vue";

export default defineComponent({
  emits: ["update:fiatAmount", "newFiatRate", "newFiatSymbol"],
  props: ["fiatAmount", "amount", "fiatSymbol"],
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

    const focus = ref(null);

    onMounted(() => {
      (focus.value as any).$el.setFocus();
    });

    const isChooseCurrencyModalOpen = ref(false);

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
.chevron {
  order: 1;
  margin-left: 5px;
  margin-top: 3px;
  font-size: 20px;
}
</style>
