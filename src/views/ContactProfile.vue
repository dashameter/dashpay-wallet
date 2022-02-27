<template>
  <ion-page>
    <ion-content class="ion-padding">
      <ion-toolbar>
        <ion-buttons
          ><ion-back-button
            class="back"
            default-href="/home"
            :icon="arrowBack"
          ></ion-back-button
        ></ion-buttons>
        <ion-avatar class="profileavatar"
          ><img :src="getUserAvatar(friendOwnerId)"
        /></ion-avatar>
      </ion-toolbar>

      <p class="userinfo">
        {{ getUserLabel(friendOwnerId) }}
      </p>
      <p class="userdisplayname">
        {{ getUserDisplayName(friendOwnerId) }}
      </p>
      <p class="statusmessage">
        {{ getUserPublicMessage(friendOwnerId) }}
      </p>

      <div class="icons">
        <ion-icon
          class="pay"
          :src="require('/public/assets/icons/chat.svg')"
          @click="
            router.push({
              path: `/conversation/${friendOwnerId}`,
            })
          "
        ></ion-icon>
        <ion-icon
          class="pay"
          :src="require('/public/assets/icons/sendHeader.svg')"
          @click="
            router.push({
              path: `/conversation/${friendOwnerId}`,
              query: { pay: 'true' },
            })
          "
        ></ion-icon>
        <ion-icon
          class="pay"
          :src="require('/public/assets/icons/QR.svg')"
          @click="openQRCodeModal"
        ></ion-icon>
      </div>

      <div class="lowericons">
        <p class="userdisplayname">
          <ion-icon
            class="joined"
            :src="require('/public/assets/icons/dashp.svg')"
          ></ion-icon>
          Joined {{ formatDate(new Date()) }}
          <!-- {{ new Date().getMonth() + 1 }}
          {{ new Date().getFullYear() }} -->
        </p>
        <p class="userdisplayname">
          <ion-icon class="joined" :icon="people"></ion-icon>
          Friends since {{ friendsDate }}
        </p>
      </div>

      <ion-toolbar class="searchbar">
        <ion-searchbar
          v-model="filterInput"
          placeholder="Search for users"
        ></ion-searchbar>
      </ion-toolbar>

      <ion-toolbar>
        <ion-buttons class="tabfeatures ion-text-capitalize">
          <ion-button
            fill="clear"
            class="tabfeatures ion-text-capitalize"
            :class="{ selected: tabSelected === 'friends' }"
            @click="tabState('friends')"
          >
            <ion-label>Friends </ion-label>
          </ion-button>

          <ion-button
            fill="clear"
            class="tabfeatures ion-text-capitalize"
            :class="{ selected: tabSelected === 'sharedFriends' }"
            @click="tabState('sharedFriends')"
          >
            <ion-label>Shared Friends </ion-label>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <friends
        v-if="tabSelected === 'friends'"
        :filteredUserFriends="filteredUserFriends"
        style="margin-top: 430px; z-index: 1"
      ></friends>

      <sharedFriends
        v-if="tabSelected === 'sharedFriends'"
        :filteredUserFriends="filteredUserFriends"
        style="margin-top: 430px; z-index: 1"
      ></sharedFriends>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { computed, watch, ref } from "vue";
import { search } from "ss-search";
import { arrowBack } from "ionicons/icons";

import friends from "@/views/friends.vue";
import sharedFriends from "@/views/sharedFriends.vue";

import {
  IonSearchbar,
  IonPage,
  IonContent,
  IonLabel,
  IonToolbar,
  IonButton,
  IonAvatar,
  IonButtons,
  IonBackButton,
  IonIcon,
  modalController,
} from "@ionic/vue";

import { getClient, getClientIdentity } from "@/lib/DashClient";

// import {} from "ionicons/icons";

import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import useChats from "@/composables/chats";
import ContactQRCodeModal from "@/components/Contact/ContactQRCodeModal.vue";
import { people } from "ionicons/icons";
import { onMounted } from "vue";
// import { Client } from "dash/dist/src/SDK/Client/index";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  name: "ContactProfile",
  components: {
    IonContent,
    IonPage,
    IonLabel,
    IonButton,
    IonToolbar,
    IonAvatar,
    IonIcon,
    IonButtons,
    IonBackButton,
    IonSearchbar,
    friends,
    sharedFriends,
  },
  setup() {
    // const client = getClient();

    // const clientIdentity = getClientIdentity();

    const router = useRouter();

    const route = useRoute();

    const store = useStore();

    const getUserPublicMessage = computed(
      () => store.getters.getUserPublicMessage
    );

    const getUserDisplayName = computed(() => store.getters.getUserDisplayName);

    const getUserLabel = computed(() => store.getters.getUserLabel);

    const getUserAvatar = computed(() => store.getters.getUserAvatar);

    const friendOwnerId = ref(route.params.friendOwnerId as string);

    const tabSelected = ref("");

    onMounted(() => {
      tabSelected.value = "friends";
    });

    const tabState = (state: string) => {
      tabSelected.value = state;
    };

    const resolveFriend = () => {
      store.dispatch("fetchDPNSDoc", friendOwnerId.value);
      store.dispatch("fetchDashpayProfiles", {
        ownerIds: [friendOwnerId.value],
      });
      store.dispatch("fetchContactRequestsSent", friendOwnerId.value);
    };

    // Resolve friend if still unknown
    resolveFriend();

    watch(
      () => route.params.friendOwnerId,
      () => {
        if (route.params.friendOwnerId) {
          friendOwnerId.value = route.params.friendOwnerId as string;
          // Resolve friend if still unknown
          resolveFriend();
        }
      }
    );

    // onMounted(async () => {});

    const openQRCodeModal = async () => {
      const modal = await modalController.create({
        component: ContactQRCodeModal,
        componentProps: {
          label: getUserLabel.value(friendOwnerId.value)?.toLowerCase(),
        },
        cssClass: "qrcode", 
      });
      return modal.present();
    };

    const filterInput = ref("");

    const filteredUserFriends = computed(() => {
      if (filterInput.value) {
        console.log("returning filtered list, filterInput", filterInput);
        console.log(
          "fields,",
          store.getters.getUserFriends(friendOwnerId.value)
        );
        // return [store.state.chatList[0]];
        return search(
          store.getters.getUserFriends(friendOwnerId.value),
          ["_searchLabel", "_searchDisplayName"],
          filterInput.value
        );
      } else {
        console.log("returning entire list, filterInput", filterInput);
        console.log(
          "fields,",
          store.getters.getUserFriends(friendOwnerId.value)
        );
        return store.getters.getUserFriends(friendOwnerId.value);
      }
    });

    const formatDate = function (date: Date) {
      const month = [
        "Jan",
        "Feb",
        "March",
        "April",
        "May",
        "June",
        "July",
        "Aug",
        "Sept",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${month[date.getMonth() + 1]} ${date.getFullYear()}`;
    };

    const friendsDate = computed(() => {
      // TODO consider contactInfo 'banning / hiding' of contact
      const dateA =
        store.state.contactRequests.sent[friendOwnerId.value]?.createdAt;
      const dateB =
        store.state.contactRequests.received[friendOwnerId.value]?.createdAt;

      if (dateA && dateB)
        return dateA > dateB ? formatDate(dateA) : formatDate(dateB);
      else return "'say hi to be friends today'";
    });

    return {
      friendsDate,
      filteredUserFriends,
      filterInput,
      openQRCodeModal,
      friendOwnerId,
      getUserPublicMessage,
      getUserDisplayName,
      getUserLabel,
      getUserAvatar,
      store,
      people,
      router,
      arrowBack,
      formatDate,
      tabState,
      tabSelected,
    };
  },
};
</script>

<style scoped>
.profileavatar {
  height: 80px;
  width: 80px;
  margin: auto;
}
.back {
  position: fixed;
  top: 16px;
  left: -25px;
  width: 17px;
  height: 15px;
  color: #6c69fc;
}

.searchbar {
  padding-left: 16px;
  padding-right: 16px;
  --background: white;
}

.pay {
  height: 40px;
  width: 40px;
}

.icons {
  display: flex;
  justify-content: center;
  gap: 25px;
}

.lowericons {
  display: flex;
  justify-content: center;
  gap: 25px;
  margin: 32px 0px;
  position: relative;
}

.joined {
  width: 18px;
  height: 18px;
  margin-right: 8px;
  color: #7d6cfd;
}
ion-footer {
  padding: 0px 0px 8px 16px;
}
.item-inner {
  padding-inline-end: 0px;
}
.social-count {
  display: flex;
  color: #7d6cfd;
  align-items: center;
  font-weight: 800;
  margin-top: 2px;
}
.social-icon {
  width: 17px;
  height: 17px;
  display: flex;
  margin-left: 2px;
  margin-right: 12px;
  margin-bottom: 1px;
}
.dash-icon {
  width: 17px;
  height: 17px;
  margin: auto;
}
ion-searchbar {
  --background: #f3f3f3;
  --border-radius: 8px;
  --box-shadow: 0;
  --icon-color: #9c9c9c;
  --placeholder-color: #9c9c9c;
  --padding: 0px;
  width: 100%;
  /* width: 334px; width in mobile with padding */
  height: 31px;
  padding-left: 0px;
  padding-right: 0px;
}
.tabheader {
  /* margin-top: 450px; */
  margin: auto;
}
ion-button {
  width: 164px;
  height: 35px;
}
.tabfeatures {
  --color-selected: #6c69fc;
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  letter-spacing: -0.003em;
  border-radius: 1.5px;
}
.selected {
  border-bottom: 3px solid #6c69fc;
  color: #6c69fc;
}
</style>
