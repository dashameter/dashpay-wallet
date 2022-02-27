<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <HomeHeader></HomeHeader>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-no-padding" >
      <ion-toolbar class="searchbar" v-if="profileCompleted < 10">
        <img
          @click="router.push('/editprofile')"
          :src="require('/public/assets/banners/complete_profile.svg')"
          alt=""
          class="profile-banner"
        />
        <div class="profile-completed">{{ profileCompleted * 10 }}%</div>
        <ion-progress-bar
          :value="profileCompleted / 10"
          class="progress"
        ></ion-progress-bar>
      </ion-toolbar>

      <ion-toolbar class="searchbar">
        <ion-searchbar v-model="filterInput"></ion-searchbar>
      </ion-toolbar>

      <ChatList :chatList="filteredChatList"></ChatList>

      <div
        v-if="filteredChatList.length === 1"
        :class="{
          box1: profileCompleted === 10,
          box_profile1: profileCompleted < 10,
        }"
      >
        <img
          :src="require('/public/assets/icons/home_graphic1.svg')"
          alt=""
          class="graphic"
        />
      </div>

      <div
        v-if="filteredChatList.length === 2"
        :class="{
          box2: profileCompleted === 10,
          box_profile2: profileCompleted < 10,
        }"
      >
        <img
          :src="require('/public/assets/icons/home_graphic1.svg')"
          alt=""
          class="graphic"
        />
      </div>

      <div
        v-if="filteredChatList.length === 3"
        :class="{
          box3: profileCompleted === 10,
          box_profile3: profileCompleted < 10,
        }"
      >
        <img
          :src="require('/public/assets/icons/home_graphic2.svg')"
          alt=""
          class="graphic"
        />
      </div>

      <img
        v-if="filteredChatList.length === 4"
        :src="require('/public/assets/icons/home_graphic3.svg')"
        alt=""
        class="graphic"
        :class="{ g4: profileCompleted === 10, g4_no: profileCompleted < 10 }"
      />

      <img
        v-if="filteredChatList.length === 5"
        :src="require('/public/assets/icons/home_graphic4.svg')"
        alt=""
        class="graphic g5"
      />

      <img
        v-if="filteredChatList.length >= 6"
        :src="require('/public/assets/icons/home_graphic5.svg')"
        alt=""
        class="graphic g6"
      />

      <ion-fab horizontal="end" vertical="bottom">
        <ion-icon
          :src="require('/public/assets/icons/message_me.svg')"
          @click="router.push(`/contactSearch`)"
        ></ion-icon>
      </ion-fab>

      <ion-fab horizontal="end" vertical="bottom" class="fab">
        <ion-icon
          :src="require('/public/assets/icons/scan.svg')"
          @click="router.push(`/senddash`)"
        >
        </ion-icon>
      </ion-fab>

      <!-- <ion-modal
        :is-open="isSendDashOpen"
        @didDismiss="showSendDash({ state: false })"
        css-class="sendrequest"
      >
        <SendDash></SendDash>
      </ion-modal> -->
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { search } from "ss-search";

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonFab,
  IonSearchbar,
  IonProgressBar,
  IonIcon,
} from "@ionic/vue";
import {
  listCircle,
  personAdd,
  send,
  download,
  scan,
  add,
} from "ionicons/icons";
import HomeHeader from "@/components/HomeHeader.vue";
import ChatList from "@/components/Chat/ChatList.vue";
import useWallet from "@/composables/wallet";
import useContacts from "@/composables/contacts";
import useChats from "@/composables/chats";
import useRates from "@/composables/rates";
// import SendDash from "@/views/SendDash.vue";

// import {
//   initClient,
//   getClient,
//   getClientOpts,
//   getClientIdentity,
// } from "@/lib/DashClient";
// import { Client } from "dash/dist/src/SDK/Client/index";

// eslint-disable-next-line @typescript-eslint/no-var-requires
// const Dashcore = require("@dashevo/dashcore-lib");

export default {
  name: "Home",
  components: {
    IonHeader,
    IonToolbar,
    IonContent,
    IonPage,
    IonSearchbar,
    IonProgressBar,
    IonFab,
    IonIcon,
    HomeHeader,
    ChatList,
    // SendDash,
  },
  setup() {
    const router = useRouter();
    // router.push("/settings");

    const store = useStore();

    // const isSendDashOpen = ref(false);

    // const sendDirection = ref("");
    // const showSendDash = async (modal: any) => {
    //   const { direction, state } = modal;
    //   sendDirection.value = direction;
    //   sendDirection.value = "send";
    //   console.log("modal direction", sendDirection.value);
    //   isSendDashOpen.value = state;
    //   console.log("modal friend", sendDirection.value);
    // };

    const filterInput = ref("");

    const { startRefreshWalletDataLoop } = useWallet();
    const { startSyncContactRequests } = useContacts();
    const { startSyncChats } = useChats();
    const { startRefreshRatesLoop } = useRates();

    startSyncChats();
    startRefreshWalletDataLoop();
    startSyncContactRequests();
    startRefreshRatesLoop();

    const profileCompleted = computed(() => {
      let completed = 7;

      if (store.getters.myAvatar !== "/assets/defaults/avataaar.png")
        completed += 1;

      if (store.getters.myDisplayName) completed += 1;

      if (store.getters.myPublicMessage) completed += 1;

      return completed;
    });

    // const profileCompleted = 8;

    const filteredChatList = computed(() => {
      if (filterInput.value) {
        console.log(
          "returning filtered list, filterInput",
          filterInput,
          store.state.chatList
        );
        return search(
          store.state.chatList,
          ["searchLabel", "searchDisplayName"],
          filterInput.value
        );
      } else {
        console.log(
          "returning entire list, filterInput",
          filterInput,
          store.state.chatList
        );
        return store.state.chatList;
      }
    });

    store.dispatch("fetchDashpayProfiles", {
      ownerIds: [store.state.accountDPNS.$ownerId],
    });

    return {
      identityId: computed(() => store.getters.identityId),
      listCircle,
      personAdd,
      send,
      download,
      getUserLabel: store.getters.getUserLabel,
      router,
      scan,
      add,
      profileCompleted,
      filterInput,
      filteredChatList,
      // showSendDash,
      // isSendDashOpen,
    };
  },
};
</script>

<style scoped>
.searchbar {
  padding-left: 16px;
  padding-right: 16px;
  --background: white;
}
.compose {
  --background: linear-gradient(38.82deg, #6a67fb 13.64%, #8d71ff 86.36%);
}
.capture {
  --background: #ffffff;
}
ion-searchbar {
  --background: #f3f3f3;
  --border-radius: 8px;
  --box-shadow: 0;
  --icon-color: #9c9c9c;
  --placeholder-color: #9c9c9c;
  width: 100%;
  /* width: 334px; width in mobile with padding */
  height: 31px;
  padding-left: 0px;
  padding-right: 0px;
}
.progress {
  position: absolute;
  top: 122px;
  left: 17px;
  width: 180px;
}
.profile-banner {
  position: relative;
  width: 400px;
  height: 68px;
  margin-top: 70px;
}
.profile-completed {
  position: absolute;
  top: 99px;
  left: 17px;
  z-index: 1;
  font-style: normal;
  font-weight: bold;
  font-size: 12px;
  line-height: 18px;
  color: #000000;
}
.graphic {
  display: block;
  width: 333px;
  height: 200px;
  margin: auto;
}
.box1 {
  display: flex;
  height: 440px;
  position: relative;
}
.box_profile1 {
  display: flex;
  height: 358px;
  position: relative;
}
.box2 {
  display: flex;
  height: 374px;
  position: relative;
}
.box_profile2 {
  display: flex;
  height: 292px;
  position: relative;
}
.box3 {
  display: flex;
  height: 308px;
  position: relative;
}
.box_profile3 {
  display: flex;
  height: 226px;
  position: relative;
}
.g4 {
  margin-bottom: 15px;
}
.g4_no {
  margin-bottom: 0px;
}
.g5 {
  margin-bottom: 0px;
}
.g6 {
  margin-bottom: -20px;
}
ion-icon {
  width: 60px;
  height: 60px;
}
.fab {
  position: fixed;
  bottom: 75px;
}
</style>
