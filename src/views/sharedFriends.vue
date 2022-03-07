<template>
  <ion-page>
    <ion-content>
      <ion-list>
        <ion-item v-for="contact in sharedFriends" :key="contact.id" button>
          <ion-avatar
            slot="start"
            @click="router.push(`/profile/${contact.data.toUserId.toString()}`)"
          >
            <img :src="getUserAvatar(contact.data.toUserId.toString())" />
          </ion-avatar>
          <ion-label
            @click="
              router.push(`/conversation/${contact.data.toUserId.toString()}`)
            "
          >
            <h2
              class="
                flex
                ion-align-items-center ion-justify-content-between ion-nowrap
              "
            >
              {{ getUserLabel(contact.data.toUserId.toString()) }}
              <div class="flex ion-nowrap ion-align-items-center">
                <span class="social-count">
                  {{ contact._socialMetrics.count }}
                  <ion-icon
                    :icon="people"
                    color="tertiary"
                    class="social-icon"
                  ></ion-icon>
                </span>
                <ion-icon
                  :src="
                    contact._socialMetrics.isMyFriend
                      ? require('/public/assets/icons/dashd-purple.svg')
                      : require('/public/assets/icons/dashd-grey.svg')
                  "
                  color="tertiary"
                  class="dash-icon"
                ></ion-icon>
              </div>
            </h2>
            <h3>
              {{ getUserDisplayName(contact.data.toUserId.toString()) }}
            </h3>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import { defineComponent } from "vue";
import {
  IonContent,
  IonPage,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonIcon,
} from "@ionic/vue";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";

export default defineComponent({
  props: ["sharedFriends"],
  components: {
    IonContent,
    IonPage,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonIcon,
  },

  setup() {
    const router = useRouter();

    const route = useRoute();

    const store = useStore();

    const getUserDisplayName = computed(() => store.getters.getUserDisplayName);

    const getUserLabel = computed(() => store.getters.getUserLabel);

    const getUserAvatar = computed(() => store.getters.getUserAvatar);

    return {
      router,
      route,
      store,
      getUserDisplayName,
      getUserLabel,
      getUserAvatar,
    };
  },
});
</script>
