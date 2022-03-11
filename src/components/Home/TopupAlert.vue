<template>
  <ion-alert
    :is-open="isOpenRef"
    header="Low Credit Balance"
    :sub-header="credits + ' credits remaining'"
    message="Dash Platform uses credits to pay for usage fees. Topup now to keep using your dapps without interuption."
    :buttons="buttons"
    @didDismiss="setOpen(false)"
  >
  </ion-alert>
  <ion-alert
    :is-open="isOpenSuccess"
    header="Success"
    :sub-header="credits + ' credits remaining'"
    message="You topped up your credits and can continue using your dapps."
    :buttons="['Ok']"
    @didDismiss="isOpenSuccess = false"
  >
  </ion-alert>
</template>

<script lang="ts">
import { IonAlert } from "@ionic/vue";
import { defineComponent, ref } from "vue";

import { getClientIdentity, getClient } from "../../lib/DashClient";

export default defineComponent({
  components: { IonAlert },
  setup() {
    const isOpenRef = ref(false);
    const isOpenSuccess = ref(false);

    const identity = getClientIdentity();
    console.log("identity from topup :>> ", identity);
    const credits = identity.balance;
    console.log("topup identity :>> ", identity);

    const setOpen = (state: boolean) => (isOpenRef.value = state);

    const buttons = [
      {
        text: "Dismiss",
        role: "cancel",
        id: "cancel-button",
      },
      {
        text: "Top Up",
        id: "confirm-button",
        handler: async () => {
          await getClient().platform?.identities.topUp(identity.id, 1000);
          isOpenSuccess.value = true;
        },
      },
    ];

    if (identity.balance <= 100000) setOpen(true);

    return { credits, buttons, isOpenRef, setOpen, isOpenSuccess };
  },
});
</script>
