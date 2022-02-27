<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ChatHeader :friendOwnerId="friendOwnerId"></ChatHeader>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding-start ion-padding-end">
      <ChatBubbles
        :chatMsgs="getChatMsgs(friendOwnerId)"
        :friendOwnerId="friendOwnerId"
        @send-chat-wrapper="sendChatWrapper"
      ></ChatBubbles>
    </ion-content>
    <ion-modal
      :is-open="isSendRequestPopupOpen"
      @didDismiss="showSendRequestPopup(false)"
      css-class="popup"
    >
      <SendRequestPopup
        @showRequestDashModal="showSendRequestDashModal"
        @showSendDashModal="showSendRequestDashModal"
      >
      </SendRequestPopup>
    </ion-modal>
    <ion-modal
      :is-open="isSendRequestDashModalOpen"
      @didDismiss="showSendRequestDashModal({ state: false })"
      css-class="sendrequest"
    >
      <SendRequestModal
        :initSendRequestDirection="sendRequestDirection"
        :friendOwnerId="friendOwnerId"
        @handleSendRequest="handleSendRequest"
      ></SendRequestModal>
    </ion-modal>
    <ion-footer class="ion-no-padding ion-no-border" style="margin-top: 10px">
      <chat-footer
        :receivedContactRequest="receivedContactRequest(friendOwnerId)"
        :sentContactRequest="sentContactRequest(friendOwnerId)"
        :friendOwnerId="friendOwnerId"
        @send-chat-wrapper="sendChatWrapper"
        @showSendRequestPopup="showSendRequestPopup"
      ></chat-footer>
    </ion-footer>
  </ion-page>
</template>

<script lang="ts">
import { ref, watchEffect, watch, computed } from "vue";

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonFooter,
  IonModal,
} from "@ionic/vue";

import { useRoute } from "vue-router";
import { useStore } from "vuex";
import useChats from "@/composables/chats";
import ChatBubbles from "@/components/Chat/ChatBubbles.vue";
import ChatHeader from "@/components/Chat/ChatHeader.vue";
import ChatFooter from "@/components/Chat/ChatFooter.vue";
import SendRequestModal from "@/components/TransactionModals/SendRequestModal.vue";
import SendRequestPopup from "@/components/TransactionModals/SendRequestPopup.vue";
import { getClient } from "@/lib/DashClient";

// import { Client } from "dash/dist/src/SDK/Client/index";

// const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  name: "Conversation",
  components: {
    IonHeader,
    IonToolbar,
    IonContent,
    IonPage,
    ChatBubbles,
    ChatHeader,
    ChatFooter,
    SendRequestModal,
    SendRequestPopup,
    IonModal,
    IonFooter,
  },
  setup() {
    const route = useRoute();

    const store = useStore();

    const getUserLabel = computed(() => store.getters.getUserLabel);

    const friendOwnerId = ref(route.params.friendOwnerId as string);

    const {
      getChatMsgs,
      sendChat,
      sentContactRequest,
      receivedContactRequest,
    } = useChats();

    const chatText = ref("");

    watch(
      () => route.params.friendOwnerId,
      () => {
        if (route.params.friendOwnerId) {
          friendOwnerId.value = route.params.friendOwnerId as string;

          // Resolve friend if still unknown
          store.dispatch("fetchDPNSDoc", friendOwnerId.value);
          store.dispatch("fetchDashpayProfiles", {
            ownerIds: [friendOwnerId.value],
          });
        }
      }
    );

    // Mark msgs as read
    watchEffect(() => {
      console.log("watcheffect friendOwnerId.value :>> ", friendOwnerId.value);
      console.log(
        "watcheffect store.getters.getChatMsgs(friendOwnerId.value) length :>> ",
        store.getters.getChatMsgs(friendOwnerId.value).length,
        store.getters.getChatMsgs(friendOwnerId.value)
      );
      if (!(store.getters.getChatMsgs(friendOwnerId.value).length > 0)) return;

      const getLastMsgTimestamp = (msgs: any[]) => {
        return msgs[msgs.length - 1].createdAt.getTime();
      };

      const lastTimestamp = getLastMsgTimestamp(
        store.getters.getChatMsgs(friendOwnerId.value)
      );

      store.commit("setLastSeenChatTimestampByOwnerId", {
        lastTimestamp,
        friendOwnerId: friendOwnerId.value,
      });

      store.dispatch("saveLastSeenChatTimestamps");
    });

    // Handle the Dash Button
    const isSendRequestPopupOpen = ref(false);

    const isSendRequestDashModalOpen = ref(false);

    const showSendRequestPopup = async (state: boolean) => {
      isSendRequestPopupOpen.value = state;
    };

    const sendRequestDirection = ref("");

    const showSendRequestDashModal = async (modal: any) => {
      const { direction, state } = modal;
      sendRequestDirection.value = direction;
      console.log("modal direction", sendRequestDirection.value);
      isSendRequestDashModalOpen.value = state;
      console.log("modal friend", sendRequestDirection.value);
    };

    // Allow deeplinking to payment modal
    watch(
      () => route.query.pay,
      () => {
        if (route.query.pay === "true") {
          showSendRequestDashModal({ state: true, direction: "send" });
        }
      }
    );

    const sendChatWrapper = (message: string, amount: number, request: any) => {
      // TODO add types

      const replyToChatId = store.getters.getActiveReplyToId(
        friendOwnerId.value
      );

      console.log(
        "message: string, amount: number, request: any",
        message,
        amount,
        request,
        replyToChatId
      );
      sendChat(message, friendOwnerId.value, amount, request, replyToChatId);

      // reset the friend's replyToId
      store.commit("setActiveReplyToId", {
        friendOwnerId: friendOwnerId.value,
        replyToId: undefined,
      });
    };

    const handleSendRequest = (event: any) => {
      console.log("event :>> ", event);
      const request = event.sendRequestDirection === "request" ? "open" : "";
      console.log("request :>> ", request);
      console.log(
        "sendChat",
        event.message,
        friendOwnerId.value,
        event.amount,
        request
      );
      sendChatWrapper(event.message, event.amount, request); // TODO add replyToChatId for requests
    };

    return {
      chatText,
      sendChatWrapper,
      friendOwnerId,
      getChatMsgs,
      getUserLabel,
      store,
      isSendRequestPopupOpen,
      showSendRequestPopup,
      isSendRequestDashModalOpen,
      showSendRequestDashModal,
      handleSendRequest,
      sendRequestDirection,
      sentContactRequest,
      receivedContactRequest,
    };
  },
};
</script>

<style>
.sendrequest .modal-wrapper {
  position: fixed;
  top: 8%;
  --height: 92%;
  --border-radius: 10px 10px 0px 0px;
  /* --box-shadow: 0px -0.5px 2px 1px rgba(0, 0, 0, 0.1); */
}
.popup .modal-wrapper {
  position: fixed;
  top: 66%;
  --height: 34%;
  --border-radius: 10px 10px 0px 0px;
  /* --box-shadow: 0px -0.5px 2px 1px rgba(0, 0, 0, 0.1); */
}
.viewrequestmessage .modal-wrapper {
  position: fixed;
  top: 16%;
  --height: 74%;
  --border-radius: 10px 10px 0px 0px;
  /* --box-shadow: 0px -0.5px 2px 1px rgba(0, 0, 0, 0.1); */
}
.viewrequest .modal-wrapper {
  position: fixed;
  top: 35%;
  --height: 65%;
  --border-radius: 10px 10px 0px 0px;
  /* --box-shadow: 0px -0.5px 2px 1px rgba(0, 0, 0, 0.1); */
}
.qrcode .modal-wrapper {
  position: fixed;
  top: 47%;
  --height: 53%;
  --border-radius: 10px 10px 0px 0px;
  /* --box-shadow: 0px -0.5px 2px 1px rgba(0, 0, 0, 0.1); */
}
</style>

<style scoped>
ion-footer {
  padding: 0px 0px 8px 0px;
}
</style>
