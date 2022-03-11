import { createStore } from "vuex";
import { getClient } from "@/lib/DashClient";
import { Storage } from "@capacitor/storage";
import { msgDate } from "@/lib/helpers/Date";
import useWallet from "@/composables/wallet";
const { myTransactionHistory } = useWallet();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// const timestamp = () => Math.floor(Date.now())

const getDefaultState = () => {
  return {
    accountDPNS: null,
    balance: null, // TODO deprecated, remove
    wishName: null,
    isMnemonicBackedUp: false,
    dpns: {},
    dashpayProfiles: {},
    socialGraph: {
      sentByOwnerId: {},
      suggestedContacts: [], //ordered by common connections
    },
    contactRequests: {
      received: {},
      sent: {},
      lastTimestampReceived: 0,
      lastTimestampSent: 0,
    },
    chats: {
      msgsByOwnerId: {},
      msgsByDocumentId: {},
      RequestByReplyToId: {},
      lastTimestamp: 0,
      lastSeenTimestampByOwnerId: {},
    },
    chatList: [{ id: "legacy" }],
    fiatRate: {},
    fiatSymbol: "",
    activeReplyToIds: {}, // The msgId we reply to, one per contact
    toast: { isOpen: false, text: "", type: "", icon: "", timestamp: 0 },
  };
};

const state = getDefaultState();
interface SetLastSeenTimestampByOwnerIdMutation {
  friendOwnerId: string; // identityId or String("legacy")
  lastTimestamp: number;
}

interface SetActiveReplyToIdMutation {
  friendOwnerId: string; // TODO use id regexp
  replyToId: string | undefined;
  msgOwnerId: string | undefined;
}

const mutations = {
  setToastOptions(state: any, options: ToastOptions) {
    state.toast.text = options.text;
    state.toast.color = options.color;
    state.toast.type = options.type;
    state.toast.icon = options.icon;
    // state.toast.show = true
    state.toast.timestamp = Date.now();
  },
  setToastOpenState(state: any, isOpen: boolean) {
    state.toast.isOpen = isOpen;
  },
  setActiveReplyToId(state: any, payload: SetActiveReplyToIdMutation) {
    state.activeReplyToIds[payload.friendOwnerId] = {
      replyToId: payload.replyToId,
      msgOwnerId: payload.msgOwnerId,
    };
  },
  setIsMnemonicBackedUp(state: any, newState: boolean) {
    state.isMnemonicBackedUp = newState;
  },
  resetStateKeepAccountDPNS(state: any) {
    const newState = getDefaultState();
    newState.accountDPNS = state.accountDPNS;
    newState.dpns = state.dpns;
    Object.assign(state, newState);
  },
  resetStateKeepDashpayProfiles(state: any) {
    const newState = getDefaultState();
    newState.dashpayProfiles = state.dashpayProfiles;
    newState.dpns = state.dpns;
    Object.assign(state, newState);
  },
  resetState(state: any) {
    Object.assign(state, getDefaultState());
  },
  setFiatSymbol(state: any, symbol: string) {
    state.fiatSymbol = symbol;
  },
  setFiatRate(state: any, rate: any) {
    state.fiatRate[rate.quoteCurrency] =
      state.fiatRate[rate.quoteCurrency] || {};

    state.fiatRate[rate.quoteCurrency] = rate;
  },
  setLastSeenChatTimestampObject(state: any, obj: any) {
    state.chats.lastSeenTimestampByOwnerId = obj;
  },
  setLastSeenChatTimestampByOwnerId(
    state: any,
    { friendOwnerId, lastTimestamp }: SetLastSeenTimestampByOwnerIdMutation
  ) {
    console.log("lastTimestamp :>> ", lastTimestamp);
    state.chats.lastSeenTimestampByOwnerId[friendOwnerId] = lastTimestamp;
  },
  sortChatList(state: any) {
    const chatList: any = [];

    // interface ChatListItem {
    //   direction: string;
    //   contactRequestReceived: any;
    //   contactRequestSent: any;
    //   friendshipState: string;
    //   searchLabel: string;
    //   searchDisplayName: string;
    // }

    interface ChatListItemsOptions {
      friendOwnerId: string;
      type: string;
      lastMessage: any | undefined;
    }
    const createChatListItem = (opts: ChatListItemsOptions) => {
      const { friendOwnerId, type, lastMessage } = opts;

      const contactRequestReceived =
        state.contactRequests.received[friendOwnerId];

      const contactRequestSent = state.contactRequests.sent[friendOwnerId];

      const friendshipState =
        contactRequestReceived && contactRequestSent ? "LINKED" : "UNLINKED";

      const searchLabel =
        (state.dpns as any)[friendOwnerId]?.data.label ??
        friendOwnerId.substr(0, 6);

      const searchDisplayName = (state.dashpayProfiles as any)[friendOwnerId]
        ?.data.displayName;

      let direction, sortDate, id;

      if (lastMessage) {
        id = type + "_" + lastMessage.id.toString();
        direction =
          lastMessage.ownerId.toString() === friendOwnerId
            ? "RECEIVED"
            : "SENT";
        sortDate = lastMessage.createdAt;
      } else {
        id = type + "_" + friendOwnerId;
        sortDate =
          contactRequestSent?.createdAt > contactRequestReceived?.createdAt
            ? contactRequestSent.createdAt
            : contactRequestReceived.createdAt;
      }

      return {
        id: type + lastMessage?.id.toString(),
        type,
        friendOwnerId,
        lastMessage,
        direction,
        friendshipState,
        contactRequestReceived,
        contactRequestSent,
        searchLabel,
        searchDisplayName,
        sortDate,
      };
    };

    Object.entries(state.chats.msgsByOwnerId).forEach((entry) => {
      const friendOwnerId = entry[0];

      const chatMsgs = entry[1] as [];

      const lastMessage: any = chatMsgs[chatMsgs.length - 1];

      const chatListItem = createChatListItem({
        type: "message",
        lastMessage,
        friendOwnerId,
      });

      // Only add items with existing contactRequests
      if (
        chatListItem.contactRequestReceived ||
        chatListItem.contactRequestSent
      ) {
        chatList.push(chatListItem);
      }
    });

    // Handle legacy contact Requests that don't have a chat msg
    const alreadyShownContactIds = chatList.map((chatListItem: any) =>
      chatListItem.type === "message"
        ? chatListItem.contactRequestReceived?.ownerId.toString()
        : undefined
    );

    const allReceivedContactIds = Object.keys(state.contactRequests.received);

    const remainingContactIds = allReceivedContactIds.filter(
      (friendOwnerId: string) => !alreadyShownContactIds.includes(friendOwnerId)
    );

    remainingContactIds.forEach((friendOwnerId: string) => {
      const chatListItem = createChatListItem({
        type: "message",
        friendOwnerId,
        lastMessage: undefined,
      });

      chatList.push(chatListItem);
    });

    // Add an item for legacy payments
    // TODO sort legacy payment item by most recent payment date
    console.log(
      "sortchatlist yTransactionHistory.value :>> ",
      myTransactionHistory.value
    );
    chatList.push({
      id: "legacy",
      sortDate: new Date(myTransactionHistory.value[0].time * 1000),
      direction: myTransactionHistory.value[0].type.toUpperCase(),
      lastMessage: {
        data: { amount: myTransactionHistory.value[0].to[0].satoshis },
      },
    });

    // Sort the mixed msg and contact items
    // TODO sort contact items by payment dates
    const chatListSorted = chatList.sort(
      (a: any, b: any) => b.sortDate - a.sortDate
    );

    state.chatList = chatListSorted;
  },
  setAccountDPNS(state: any, accountDPNS: any) {
    state.accountDPNS = accountDPNS;
  },
  setDPNS(state: any, dpnsDoc: any) {
    state.dpns[dpnsDoc.ownerId.toString()] = dpnsDoc;
  },
  setWishName(state: any, wishName: string) {
    state.wishName = wishName;
  },
  setContactRequestReceived(state: any, contactRequest: any) {
    const friendOwnerId = contactRequest.ownerId.toString();

    state.contactRequests.received[friendOwnerId] = contactRequest;
  },
  setContactRequestSent(state: any, contactRequest: any) {
    const friendOwnerId = contactRequest.data.toUserId.toString();

    state.contactRequests.sent[friendOwnerId] = contactRequest;
  },
  setSocialGraphSent(state: any, contactRequest: any) {
    if (!contactRequest) return;
    console.log(
      "setSocialGraphSent contactRequest.toJSON() :>> ",
      contactRequest.toJSON()
    );

    const ownerId = contactRequest.ownerId.toString();

    const toUserId = contactRequest.data.toUserId.toString();

    state.socialGraph.sentByOwnerId[ownerId] = state.socialGraph.sentByOwnerId[
      ownerId
    ] || { docs: {}, lastTimestamp: 0 };

    state.socialGraph.sentByOwnerId[ownerId].docs[toUserId] = contactRequest;

    // TODO don't store timestamp if fetch was sorted 'desc', ideally move to different mutation
    state.socialGraph.sentByOwnerId[
      ownerId
    ].lastTimestamp = contactRequest.createdAt.getTime();
  },
  setContactRequestReceivedLastTimestamp(state: any, timestamp: Date) {
    state.contactRequests.lastTimestampReceived = timestamp;
  },
  setContactRequestSentLastTimestamp(state: any, timestamp: number) {
    // console.log("timestamp :>> ", timestamp);
    state.contactRequests.lastTimestampSent = timestamp;
  },
  setChatMsgs(state: any, chatMsgs: any[]) {
    // Cache documents by $id
    chatMsgs.forEach((chatMsg: any) => {
      const documentId = chatMsg.id.toString();
      state.chats.msgsByDocumentId[documentId] =
        state.chats.msgsByDocumentId[documentId] || {};
      state.chats.msgsByDocumentId[documentId] = chatMsg;

      // Cache request accept / decline responses by replyToId
      if (
        chatMsg.data.replyToChatId &&
        (chatMsg.data.request === "accept" ||
          chatMsg.data.request === "decline")
      ) {
        const replyToChatId = chatMsg.data.replyToChatId;
        state.chats.RequestByReplyToId[replyToChatId] =
          state.chats.RequestByReplyToId[replyToChatId] || {};
        state.chats.RequestByReplyToId[replyToChatId] = chatMsg;
      }

      // Collate the chats by the friendOwnerId
      const myOwnerId = state.accountDPNS.$ownerId;

      let friendOwnerId: string;

      if (chatMsg.ownerId.toString() === myOwnerId)
        friendOwnerId = chatMsg.data.toOwnerId;
      else friendOwnerId = chatMsg.ownerId.toString();

      state.chats.msgsByOwnerId[friendOwnerId] = (
        state.chats.msgsByOwnerId[friendOwnerId] || []
      ).concat(chatMsg);

      // Deduplicate msgs that were committed directly to state after ST by id
      state.chats.msgsByOwnerId[friendOwnerId] = [
        ...new Map(
          state.chats.msgsByOwnerId[friendOwnerId].map((msg: any) => [
            msg.id.toString(),
            msg,
          ])
        ).values(),
      ];

      // state.chats.msgsByOwnerId[friendOwnerId] = state.chats.msgsByOwnerId[
      //   friendOwnerId
      // ].filter(
      //   (msg: any, index: number, self: any) =>
      //     index === self.findIndex((t: any) => t.id === msg.id)
      // );
    });

    // console.log("state.chats.msgsByOwnerId :>> ", state.chats.msgsByOwnerId);
  },
  setChatMsgsLastTimestamp(state: any, timestamp: Date) {
    state.chats.lastTimestamp = timestamp;
  },
  setDashpayProfiles(state: any, dashpayProfiles: any) {
    // console.log("setDashpayProfiles", dashpayProfiles);
    dashpayProfiles.forEach((profile: any) => {
      // console.log("profile :>> ", profile);
      state.dashpayProfiles[profile.ownerId.toString()] = profile;
    });
  },
};
enum ToastColors {
  "primary",
  "secondary",
  "tertiary",
  "success",
  "warning",
  "danger",
  "light",
  "medium",
  "dark",
}
interface ToastOptions {
  text: string;
  color: ToastColors | undefined;
  type: string | undefined;
  icon: string | undefined;
}

const actions = {
  showToast(context: any, options: ToastOptions) {
    context.commit("setToastOptions", options);
  },
  async loadLastSeenChatTimestamps(context: any) {
    console.log("loadLastSeenChatTimestamps");
    const readResult = await Storage.get({
      key: `lastSeenChatTimestamps_${context.getters.myLabel}`,
    });
    console.log(
      "loadLastSeenChatTimestamps readResult.value :>> ",
      readResult.value
    );
    if (readResult.value) {
      context.commit(
        "setLastSeenChatTimestampObject",
        JSON.parse(readResult.value)
      );
    }
  },
  async saveLastSeenChatTimestamps(context: any) {
    await Storage.set({
      key: `lastSeenChatTimestamps_${context.getters.myLabel}`,
      value: JSON.stringify(context.state.chats.lastSeenTimestampByOwnerId),
    });
  },
  async fetchMsgById(context: any, payload: any) {
    // TODO desctructure and add type
    const msgId = payload.msgId;
    const ownerId = payload.ownerId;

    if (context.state.chats.msgsByDocumentId[msgId]) return; // If cache exists, don't hit DAPI again

    const client = getClient();

    const msg = await client?.platform?.documents.get("dashpayWallet.chat", {
      where: [
        ["toOwnerId", "==", ownerId],
        ["$id", "==", msgId],
      ],
    });

    context.commit("setChatMsgs", msg);
  },
  async resolveUserFeatures(context: any, { ownerId = "" }) {
    console.log("resolveUserFeatures", ownerId);
    if (!ownerId)
      throw new Error("resolveUserFeatures Error: No ownerId given");

    const client = getClient();

    async function resolveChatAndRequests() {
      const [result] = await client?.platform?.documents.get(
        "dashpayWallet.chat",
        {
          where: [["$ownerId", "==", ownerId.toString()]],
          limit: 1,
        }
      );

      return !!result;
    }

    const features = { chatAndRequests: false };

    features.chatAndRequests = await resolveChatAndRequests();

    console.log("resolveUserFeatures features :>> ", features);

    // if (result) {
    //   context.commit("setDashpayProfiles", results);
    //   context.commit("sortChatList"); // TODO optimize performance
    // }
    const dpnsDoc = {
      ...context.state.dpns[ownerId],
      _features: features,
    };

    context.commit("setDPNS", dpnsDoc);

    return features;
  },
  async fetchDashpayProfiles(
    context: any,
    { ownerIds = [], forceRefresh = false }
  ) {
    console.log("fetchDashpayProfiles", ownerIds);

    const client = getClient();

    const filteredOwnerIds = forceRefresh
      ? ownerIds
      : ownerIds
          // Filter out ownerIds with already cached profiles
          // TODO optimize refreshing profils once they are permanently cached
          .filter(
            (ownerId: any) =>
              !(ownerId.toString() in context.state.dashpayProfiles)
          );

    const profilePromises = filteredOwnerIds.map((ownerId: any) =>
      client?.platform?.documents.get("dashpay.profile", {
        where: [["$ownerId", "==", ownerId.toString()]],
      })
    );

    const results = (await Promise.all(profilePromises))
      .map((x: any) => x[0])
      .filter((x) => !!x);

    console.log("fetchDashpayProfile results :>> ", results);

    if (results.length > 0) {
      context.commit("setDashpayProfiles", results);
      context.commit("sortChatList"); // TODO optimize performance
      context.dispath("resolveContactCapibilities");
    }

    return results; // TODO return cached entries as well
  },
  async syncChats(context: any) {
    const myOwnerId = context.state.accountDPNS?.$ownerId;

    if (!myOwnerId) return; // Don't sync while we are not logged in

    const client = getClient();

    console.log("context.state :>> ", context.state);

    const { lastTimestamp } = context.state.chats;

    const promiseSent = client?.platform?.documents.get("dashpayWallet.chat", {
      where: [
        ["$ownerId", "==", myOwnerId],
        ["$createdAt", ">", lastTimestamp],
      ],
    });

    const promiseReceived = client?.platform?.documents.get(
      "dashpayWallet.chat",
      {
        where: [
          // ["$ownerId", "!=", myOwnerId], // This query is not yet supported by platform
          ["toOwnerId", "==", myOwnerId],
          ["$createdAt", ">", lastTimestamp],
        ],
        orderBy: [["$createdAt", "desc"]],
      }
    );

    const [resultSent, resultReceived] = await Promise.all([
      promiseSent,
      promiseReceived,
    ]);

    // Filter out duplicate "note to self" messages where (ownerId === toOwnerId)
    const resultReceivedFiltered = resultReceived.filter(
      (chat: any) => chat.ownerId.toString() !== myOwnerId
    );

    const results = [...resultSent, ...resultReceivedFiltered].sort(
      (a, b) => a.createdAt - b.createdAt
    );

    // console.log("results :>> ", results);

    if (results.length > 0) {
      context.commit("setChatMsgs", results);
      context.commit(
        "setChatMsgsLastTimestamp",
        results[results.length - 1].createdAt.getTime()
      );
      context.commit("sortChatList");
    }
  },
  // async syncSocialGraph(context: any) {},
  async fetchContactRequestsSent(context: any, ownerId: any) {
    // Used to parse the social graph
    const client = getClient();

    const sentByOwnerId = state.socialGraph.sentByOwnerId as any;

    const lastTimestampSent = sentByOwnerId[ownerId]?.lastTimestamp || 0;

    // console.log("fetchContactRequestsSent", ownerId, lastTimestampSent);
    // console.log("dashpay.contactRequest", {
    //   where: [
    //     ["$ownerId", "==", ownerId],
    //     ["$createdAt", ">", lastTimestampSent],
    //   ],
    //   orderBy: [["$createdAt", "asc"]],
    // });
    const resultSent = await client?.platform?.documents.get(
      "dashpay.contactRequest",
      {
        where: [
          ["$ownerId", "==", ownerId],
          ["$createdAt", ">", lastTimestampSent],
        ],
        orderBy: [["$createdAt", "asc"]],
      }
    );

    // console.log(
    //   "fetchContactRequestsSent resultSent :>> ",
    //   resultSent.map((x: any) => x.toJSON())
    // );

    resultSent.forEach((contactRequest: any) => {
      context.commit("setSocialGraphSent", contactRequest);
      context.dispatch("fetchDPNSDoc", contactRequest.data.toUserId.toString()); // TODO fetch using 'in' operator with Identifier
    });

    const resultSentFriendOwnerIds = resultSent.map((contactRequest: any) =>
      contactRequest.data.toUserId.toString()
    );

    context.dispatch("fetchDashpayProfiles", {
      ownerIds: resultSentFriendOwnerIds,
    }); // TODO use identifier and 'in' operator

    if (resultSent.length > 0) {
      await sleep(100);

      await context.dispatch("fetchContactRequestsSent", ownerId);
    }
  },
  async syncContactRequests(context: any) {
    if (!context.state.accountDPNS) return; // Don't sync if we are not logged in

    const client = getClient();

    console.log("context.state :>> ", context.state);

    const {
      lastTimestampReceived,
      lastTimestampSent,
    } = context.state.contactRequests;

    const promiseSent = client?.platform?.documents.get(
      "dashpay.contactRequest",
      {
        where: [
          ["$ownerId", "==", context.state.accountDPNS.$ownerId],
          ["$createdAt", ">", lastTimestampSent],
        ],
      }
    );

    const promiseReceived = client?.platform?.documents.get(
      "dashpay.contactRequest",
      {
        where: [
          ["toUserId", "==", context.state.accountDPNS.$ownerId],
          ["$createdAt", ">", lastTimestampReceived],
        ],
      }
    );

    const [resultSent, resultReceived] = await Promise.all([
      promiseSent,
      promiseReceived,
    ]);

    // console.log("resultSent :>> ", resultSent);

    // console.log("resultReceived :>> ", resultReceived);

    resultSent.forEach((contactRequest: any) => {
      context.commit("setContactRequestSent", contactRequest);

      context.commit(
        "setContactRequestSentLastTimestamp",
        contactRequest.createdAt.getTime()
      );

      context.dispatch("fetchDPNSDoc", contactRequest.data.toUserId.toString());
    });

    const resultSentFriendOwnerIds = resultSent.map((contactRequest: any) =>
      contactRequest.data.toUserId.toString()
    );

    context.dispatch("fetchDashpayProfiles", {
      ownerIds: resultSentFriendOwnerIds,
    }); // TODO use identifier and 'in' operator

    resultReceived.forEach((contactRequest: any) => {
      context.commit("setContactRequestReceived", contactRequest);

      context.commit(
        "setContactRequestReceivedLastTimestamp",
        contactRequest.createdAt.getTime()
      );

      context.dispatch("fetchDPNSDoc", contactRequest.ownerId.toString());
    });

    const resultReceivedFriendOwnerIds = resultReceived.map(
      (contactRequest: any) => contactRequest.ownerId.toString()
    );

    context.dispatch("fetchDashpayProfiles", {
      ownerIds: resultReceivedFriendOwnerIds,
    }); // use identifier and 'in' operator

    if (resultReceived.length > 0 || resultSent.length > 0)
      context.commit("sortChatList");
  },
  async fetchDPNSDoc(context: any, ownerId: string) {
    // If dpnsDoc is already cached, just resolve the features as they might change
    if (context.state.dpns[ownerId]) {
      await context.dispatch("resolveUserFeatures", {
        ownerId,
      });
      return;
    }

    const client = getClient();
    const [dpnsDoc] = await client?.platform?.names.resolveByRecord(
      "dashUniqueIdentityId",
      ownerId
    );

    console.log("resolve fetchDPNSDoc dpnsDoc :>> ", dpnsDoc);

    if (dpnsDoc) {
      context.commit("setDPNS", dpnsDoc);
      await context.dispatch("resolveUserFeatures", {
        ownerId,
      });
      // context.commit("sortChatList"); // TODO increase performance
    }
  },
};

const getters = {
  getTxHistory: async () => {
    const { myTransactionHistory } = useWallet();
    return myTransactionHistory.value;
  },
  name: (state: any) => state.accountDPNS?.label, // TODO deprecated, remove and refactor
  myLabel: (state: any) => state.accountDPNS?.label,
  myOwnerId: (state: any) => state.accountDPNS?.$ownerId,
  myAvatar: (state: any) => {
    return (
      (state.dashpayProfiles as any)[state.accountDPNS?.$ownerId]?.data
        .avatarUrl ?? "/assets/defaults/avataaar.png"
    );
  },
  myDisplayName: (state: any) => {
    return (
      (state.dashpayProfiles as any)[state.accountDPNS?.$ownerId]?.data
        .displayName ?? ""
    );
  },
  myPublicMessage: (state: any) => {
    return (
      (state.dashpayProfiles as any)[state.accountDPNS?.$ownerId.toString()]
        ?.data.publicMessage ?? ""
    );
  },
  getUserLabel: (state: any) => (ownerId: string) => {
    return (state.dpns as any)[ownerId]?.data.label ?? ownerId.substr(0, 6);
  },
  getUserFeatures: (state: any) => (ownerId: string) => {
    return (state.dpns as any)[ownerId]?._features ?? {};
  },
  getUserDisplayName: (state: any) => (ownerId: string) => {
    return (
      (state.dashpayProfiles as any)[ownerId]?.data.displayName ??
      (state.dpns as any)[ownerId]?.data.label ??
      ownerId.substr(0, 6)
    );
  },

  getUserAvatar: (state: any) => (ownerId: string) => {
    if (!ownerId) return "/assets/defaults/avataaar.png";

    return (
      (state.dashpayProfiles as any)[ownerId.toString()]?.data.avatarUrl ??
      "/assets/defaults/avataaar.png"
    );
  },
  getUserPublicMessage: (state: any) => (ownerId: string) => {
    return (
      (state.dashpayProfiles as any)[ownerId.toString()]?.data.publicMessage ??
      ""
    );
  },
  getSentContactRequest: (state: any) => (friendOwnerId: string) => {
    return (state.contactRequests.sent as any)[friendOwnerId];
  },
  getReceivedContactRequest: (state: any) => (friendOwnerId: string) => {
    return (state.contactRequests.received as any)[friendOwnerId];
  },
  identityId: (state: any) => state.accountDPNS?.$ownerId,
  getNewChatMsgCount: (state: any) => (friendOwnerId: string) => {
    const lastTimestamp = new Date(
      state.chats.lastSeenTimestampByOwnerId[friendOwnerId] || 0
    );

    // If there are no msgs synced, e.g. a legacy contactRequest
    if (!state.chats.msgsByOwnerId[friendOwnerId]) return 0;
    else
      return state.chats.msgsByOwnerId[friendOwnerId].filter(
        (chat: any) =>
          chat.createdAt > lastTimestamp &&
          chat.ownerId.toString() === friendOwnerId
      ).length;
  },
  getLegacyTxCount: async (state: any, getters: any) => {
    const lastTimestamp = state.chats.lastSeenTimestampByOwnerId["legacy"] || 0;
    console.log(" getLegacyTxCount lastTimestamp :>> ", lastTimestamp);

    // const { myTransactionHistory } = useWallet();

    const tx = await getters.getTxHistory;
    console.log("getLegacyTxCount tx :>> ", tx);

    if (!tx) return 0;

    return tx.filter((transaction: any) => transaction.time > lastTimestamp)
      .length;
  },
  getHasNewTx: (state: any) => (friendOwnerId: string) => {
    const lastTimestamp = new Date(
      state.chats.lastSeenTimestampByOwnerId[friendOwnerId] || 0
    );

    // If there are no msgs synced, e.g. a legacy contactRequest
    if (!state.chats.msgsByOwnerId[friendOwnerId]) return false;
    else
      return (
        state.chats.msgsByOwnerId[friendOwnerId].filter(
          (chat: any) =>
            chat.createdAt > lastTimestamp &&
            chat.ownerId.toString() === friendOwnerId &&
            chat.data.amount
        ).length > 0
      );
  },
  getSharedFriends: (state: any, getters: any) => (friendOwnerId: string) => {
    function toUserIdOf(contact: any) {
      return contact.data.toUserId;
    }

    const userFriends = getters.getUserFriends(friendOwnerId);

    const myFriends = getters.getMyFriends;

    const myFriendsIds = myFriends.map((contact: any) => toUserIdOf(contact));

    const sharedFriends = userFriends.filter((contact: any) =>
      myFriendsIds.includes(toUserIdOf(contact))
    );

    return sharedFriends;
  },
  getUserFriends: (state: any) => (friendOwnerId: string) => {
    const getSocialMetrics = (findOwnerId: string) => {
      const sentByOwnerId = state.socialGraph.sentByOwnerId;
      console.log("sentByOwnerId :>> ", sentByOwnerId);

      let count = 0;
      let isMyFriend = false;

      Object.entries(sentByOwnerId).forEach(([rootOwnerId, entry]) => {
        const contactRequestsByFindOwnerId = (entry as any).docs;
        // console.log(
        //   "contactRequestsByFindOwnerId findOwnerId :>> ",
        //   findOwnerId
        // );

        if (findOwnerId in contactRequestsByFindOwnerId) {
          count = count + 1;
        }
      });

      if (findOwnerId in state.contactRequests.sent) isMyFriend = true;
      // console.log(
      //   "state.contactRequests.sent):>> ",
      //   state.contactRequests.sent
      // );

      if (count > 0) count = count - 1; // Don't count myself

      return { count, isMyFriend };
    };

    const friends = Object.entries(
      state.socialGraph.sentByOwnerId[friendOwnerId]?.docs ?? {}
    );

    const friendsWithMeta = friends.map((entry: any) => {
      const contactRequest = entry[1];

      const ownerId = contactRequest.data.toUserId.toString();

      const _searchLabel =
        (state.dpns as any)[ownerId]?.data.label ?? friendOwnerId.substr(0, 6);

      const _searchDisplayName = (state.dashpayProfiles as any)[ownerId]?.data
        .displayName;

      return {
        ...contactRequest,
        _searchLabel,
        _searchDisplayName,
        _socialMetrics: getSocialMetrics(ownerId),
      };
    });

    return friendsWithMeta;
  },
  getMyFriends: (state: any, getters: any) => {
    return Object.entries(state.contactRequests.sent)
      .map((entry: any) => {
        const contactRequest = entry[1];

        return contactRequest;
      })
      .filter((x) => x.data.toUserId.toString() !== getters.myOwnerId)
      .sort((a: any, b: any) => {
        const aLabel = getters.getUserLabel(a.data.toUserId.toString());
        const bLabel = getters.getUserLabel(b.data.toUserId.toString());

        if (aLabel < bLabel) {
          return -1;
        }
        if (aLabel > bLabel) {
          return 1;
        }
        return 0;
      });
  },
  getSuggestedFriends: (state: any, getters: any) => {
    const getSocialMetrics = (findOwnerId: string) => {
      const sentByOwnerId = state.socialGraph.sentByOwnerId;

      let count = 0;
      let isMyFriend = false;

      Object.entries(sentByOwnerId).forEach(([rootOwnerId, entry]) => {
        const contactRequestsByFindOwnerId = (entry as any).docs;
        // console.log(
        //   "contactRequestsByFindOwnerId findOwnerId :>> ",
        //   findOwnerId
        // );

        if (findOwnerId in contactRequestsByFindOwnerId) {
          count = count + 1;
        }
      });

      if (findOwnerId in state.contactRequests.sent) isMyFriend = true;
      // console.log(
      //   "state.contactRequests.sent):>> ",
      //   state.contactRequests.sent
      // );

      return { count, isMyFriend };
    };

    let suggestedFriendsByOwnerId: any = {};

    Object.entries(state.socialGraph.sentByOwnerId).forEach((entry: any) => {
      const contactRequests = entry[1];

      suggestedFriendsByOwnerId = {
        ...suggestedFriendsByOwnerId,
        ...contactRequests.docs,
      };
    });

    // console.log("suggestedFriendsByOwnerId :>> ", suggestedFriendsByOwnerId);

    const suggestedFriends = Object.entries(suggestedFriendsByOwnerId).map(
      (entry: any) => {
        const contactRequest = entry[1];

        return {
          ...contactRequest,
          _socialMetrics: getSocialMetrics(
            contactRequest.data.toUserId.toString()
          ),
        };
      }
    );

    const alreadyFriendOwnerIds = getters.getMyFriends.map((x: any) =>
      x.data.toUserId.toString()
    );

    return suggestedFriends
      .filter((x) => {
        return (
          !alreadyFriendOwnerIds.includes(x.data.toUserId.toString()) &&
          !(x.data.toUserId.toString() === getters.myOwnerId)
        );
      })
      .sort((a, b) => b._socialMetrics.count - a._socialMetrics.count);
  },
  getChatMsgs: (state: any) => (friendOwnerId: string) => {
    const chats = (state.chats as any).msgsByOwnerId[friendOwnerId] ?? [];

    const chatsWithMeta = [];

    for (let i = 0; i < (chats ?? []).length; i++) {
      const chat = chats[i];

      const previousChat: any = chatsWithMeta[i - 1];

      const direction =
        chat.data.toOwnerId === friendOwnerId ? "SENT" : "RECEIVED";

      let displayDate = msgDate(chat.createdAt);

      if (previousChat && msgDate(previousChat.createdAt) === displayDate) {
        displayDate = "";
      }

      chatsWithMeta.push({
        ...chat,
        _friendOwnerId: friendOwnerId,
        _direction: direction || "",
        _displayDate: displayDate,
      });
    }

    return chatsWithMeta;
  },
  getChatMsgById: (state: any) => (id: string, friendOwnerId: string) => {
    const chat = state.chats.msgsByDocumentId[id];
    if (!chat) return undefined;
    // console.log("chat", chat);

    const direction =
      chat.ownerId.toString() === friendOwnerId ? "RECEIVED" : "SENT";
    // chat.ownerId.toString() === friendOwnerId ? "SENT" : "RECEIVED";
    // console.log('getchatmessagebyid', id, friendOwnerId)
    // if (chat.ownerId.toString() !== friendOwnerId)
    // debugger

    return {
      ...chat,
      _friendOwnerId: friendOwnerId,
      _direction: direction,
    };
  },
  getRequestByReplyToId: (state: any) => (replyToId: string) => {
    return state.chats.RequestByReplyToId[replyToId];
  },
  getActiveReplyToId: (state: any) => (friendOwnerId: string) => {
    return state.activeReplyToIds[friendOwnerId]?.replyToId;
  },
  getActiveReplyToMsgOwnerId: (state: any) => (friendOwnerId: string) => {
    return state.activeReplyToIds[friendOwnerId]?.msgOwnerId;
  },
  getFiatRate: (state: any) => (fiatSymbol: string) => {
    return state.fiatRate[fiatSymbol] || {};
  },
  getFiatSymbol: (state: any) => {
    return state.fiatSymbol || "USD";
  },
  getToastOpenState: (state: any) => {
    return state.toast.isOpen;
  },
};

export default createStore({
  state,
  getters,
  actions,
  mutations,
});
