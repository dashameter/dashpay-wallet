const fs = require("fs");
const Dash = require("dash");
const axios = require("axios");
const { createContactRequest } = require("../src/lib/crypto/dashpay-crypto");

//
// Config
//

// Users
const users = [
  {
    mnemonic:
      "access glad stomach deal tray entire mean grunt boy shoot want shrimp",
    label: "Alice", // + Date.now(),
    dashpayProfile: {
      avatarUrl: "http://127.0.0.1:8100/assets/avatars/A.png",
      publicMessage: "Alice in Wonderland",
      displayName: "Alice Attenborough",
    },
  },
  {
    mnemonic:
      "now tourist leopard scorpion inside nation bitter click wide razor say drastic",
    label: "Charlie", // + Date.now(),
    dashpayProfile: {
      avatarUrl: "http://127.0.0.1:8100/assets/avatars/Chen.png",
      publicMessage: "Chen is here, what's up?",
      displayName: "Chen Fullerton",
    },
  },
  {
    mnemonic:
      "together tail kingdom daughter sight airport vivid uphold nothing ball lazy panther",
    label: "Dave", // + Date.now(),
    dashpayProfile: {
      avatarUrl: "http://127.0.0.1:8100/assets/avatars/Matt.png",
      publicMessage: "It's like crypto Dash.0",
      displayName: "Dave Matthews Band",
    },
  },
  {
    mnemonic:
      "vibrant couple breeze someone input march sample fix oblige enact humor main",
    label: "Edward", // + Date.now(),
    dashpayProfile: {
      avatarUrl: "http://127.0.0.1:8100/assets/avatars/clove.png",
      publicMessage: "To Dash, or not to Dash",
      displayName: "Edward Eeeeee.....",
    },
  },
  {
    mnemonic:
      "frog brush settle aerobic fold subject favorite boost hammer height ginger season",
    label: "ash", // + Date.now(),
    dashpayProfile: {
      avatarUrl:
        "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Prescription02&hairColor=Blonde&facialHairType=MoustacheMagnum&facialHairColor=Black&clotheType=ShirtCrewNeck&clotheColor=Red&eyeType=EyeRoll&eyebrowType=RaisedExcited&mouthType=Tongue&skinColor=Pale",
      publicMessage: "Know thyself by knowing you Trust Protector",
      displayName: "Ash Dash",
    },
  },
  {
    mnemonic:
      "peace squirrel mandate charge wish fever gossip left country frame fiscal lunch",
    label: "Dashameter", // + Date.now(),
    dashpayProfile: {
      avatarUrl:
        "https://avataaars.io/?avatarStyle=Circle&topType=LongHairBun&accessoriesType=Blank&hairColor=Platinum&facialHairType=BeardLight&facialHairColor=Platinum&clotheType=ShirtVNeck&clotheColor=Blue02&eyeType=Side&eyebrowType=DefaultNatural&mouthType=Smile&skinColor=Light",
      publicMessage: "Dash by the meter",
      displayName: "FaDashtic",
    },
  },
  {
    mnemonic:
      "puppy devote coconut feed major blind panda space aunt merit brain glimpse",
    label: "lina", // + Date.now(),
    dashpayProfile: {
      avatarUrl:
        "https://avataaars.io/?avatarStyle=Circle&topType=LongHairStraight2&accessoriesType=Sunglasses&hairColor=Brown&facialHairType=Blank&clotheType=Overall&clotheColor=White&eyeType=Side&eyebrowType=SadConcerned&mouthType=Twinkle&skinColor=Light",
      publicMessage: "Mined by greatness, sent by instant.",
      displayName: "Alina the great",
    },
  },
];

const chatMessages = [
  { from: "Alice", to: "Charlie", text: "How are you" },
  { from: "Charlie", to: "Alice", text: "I am great!" },
];

const contactRequests = [{ from: "Dave", to: "Alice" }];

const userState = {};

// dashmate instance
const dapiAddresses = process.env.VUE_APP_DAPIADDRESSES
  ? JSON.parse(process.env.VUE_APP_DAPIADDRESSES)
  : undefined;

//
// End Config
//

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fundWallet = async (address) => {
  const result = await axios.get(`http://127.0.0.1:5050/drip/${address}`);
  console.log("faucet drip result :>> ", result.data);
};

const initWalletAccount = async (client) => {
  const account = await client.getWalletAccount();
  const mnemonic = client.wallet.exportWallet();
  const address = account.getUnusedAddress();
  console.log("Mnemonic:", mnemonic);
  console.log("Unused address:", address.address);

  return account;
};

const getOrCreateIdentity = async (client) => {
  console.log("Checking for an identity..");

  const identityId = client.account.identities.getIdentityIds()[0];

  console.log("identityId :>> ", identityId);

  const identity = identityId
    ? await client.platform.identities.get(identityId)
    : await client.platform.identities.register();

  console.log("identity :>> ", identity);

  console.log("identityID :>> ", identity.getId().toString());

  return identity;
};

const registerName = async ({ client, identity, name }) => {
  const platform = client.platform;
  console.log("Registering name:", name);

  console.log("identity :>> ", identity);

  console.log("identity.getId() :>> ", identity.getId());

  const nameRegistration = await platform.names.register(
    name,
    { dashUniqueIdentityId: identity.getId() },
    identity
  );

  console.log("nameRegistration :>> ", nameRegistration.toJSON());

  return nameRegistration;
};

const generateDashpayProfile = async (user) => {
  console.log("generateDashpayProfile for user", user.label);
  if (!user.dashpayProfile) return;
  console.log("generateDashpayProfile with profile", user.dashpayProfile);

  const platform = userState[user.label].client.platform;

  const docProperties = user.dashpayProfile;

  const document = await platform.documents.create(
    "dashpay.profile",
    userState[user.label].identity,
    docProperties
  );

  const documentBatch = {
    create: [document], // Document(s) to create
    replace: [], // Document(s) to update
    delete: [], // Document(s) to delete
  };

  // Sign and submit the document(s)
  const result = await platform.documents.broadcast(
    documentBatch,
    userState[user.label].identity
  );
  console.log("result :>> ", result);
};

const generateChatMessage = async (chatMessage) => {
  console.log("Sending chat", chatMessage);
  const platform = userState[chatMessage.from].client.platform;

  const docProperties = {
    text: chatMessage.text,
    replyToChatId: "",
    txId: "",
    toOwnerId: userState[chatMessage.to].identity.getId().toString(),
  };

  console.log("docProperties :>> ", docProperties);

  const document = await platform.documents.create(
    "dashpayWallet.chat",
    userState[chatMessage.from].identity,
    docProperties
  );

  const documentBatch = {
    create: [document], // Document(s) to create
    replace: [], // Document(s) to update
    delete: [], // Document(s) to delete
  };

  // Sign and submit the document(s)
  const result = await platform.documents.broadcast(
    documentBatch,
    userState[chatMessage.from].identity
  );
  console.log("result :>> ", result);
};

const generateContactRequest = async (contactRequest) => {
  console.log("Sending contactRequest", contactRequest);
  // const platform = userState[chatMessage.from].client.platform;
  console.log("userState :>> ", userState);
  const client = userState[contactRequest.from].client;
  const identity = userState[contactRequest.from].identity;
  const toUserId = userState[contactRequest.to].identity.getId().toString();
  debugger;
  const document = await createContactRequest(client, identity, toUserId);

  const documentBatch = {
    create: [document], // Document(s) to create
    replace: [], // Document(s) to update
    delete: [], // Document(s) to delete
  };

  // Sign and submit the document(s)
  const result = await client.platform.documents.broadcast(
    documentBatch,
    identity
  );

  console.log("result :>> ", result);
};

async function initWallet(user) {
  const clientOpts = {
    dapiAddresses,
    wallet: {
      mnemonic: user.mnemonic,
    },
    apps: {
      dpns: { contractId: process.env.VUE_APP_DPNS_CONTRACT_ID },
      dashpayWallet: {
        contractId:
          process.env.VUE_APP_DASHPAY_WALLET_CONTRACT_ID_local ||
          process.env.VUE_APP_DASHPAY_WALLET_CONTRACT_ID_testnet ||
          process.env.VUE_APP_DASHPAY_WALLET_CONTRACT_ID_build_testnet,
      },
      dashpay: {
        contractId: process.env.VUE_APP_DASHPAY_CONTRACT_ID,
      },
    },
  };

  console.dir(clientOpts, { depth: 100 });

  userState[user.label] = {};
  userState[user.label].client = new Dash.Client(clientOpts);

  userState[user.label].client.account = await initWalletAccount(
    userState[user.label].client
  );
}
async function generateUser(user) {
  try {
    const nameRegistration = await registerName({
      client: userState[user.label].client,
      identity: userState[user.label].identity,
      name: `${user.label}.dash`,
    });

    console.log("nameRegistration :>> ", nameRegistration);

    // await saveNameVars({ identity, nameRegistration })
  } catch (e) {
    console.error("Something went wrong:\n", e);
    console.dir(e, { depth: 100 });
    console.dir(e.metadata, { depth: 100 });
  } finally {
    // client.disconnect()
  }
}

async function initWallets() {
  for (let idx = 0; idx < users.length; idx++) {
    const user = users[idx];
    await initWallet(user);
  }
}

async function generateUsers() {
  for (let idx = 0; idx < users.length; idx++) {
    const user = users[idx];
    await generateUser(user);
  }
}

async function generateChatMessages() {
  for (let idx = 0; idx < chatMessages.length; idx++) {
    const chatMessage = chatMessages[idx];
    await generateChatMessage(chatMessage);
  }
}

async function generateContactRequests() {
  for (let idx = 0; idx < contactRequests.length; idx++) {
    const contactRequest = contactRequests[idx];
    await generateContactRequest(contactRequest);
  }
}

async function fundWallets() {
  for (let idx = 0; idx < users.length; idx++) {
    const user = users[idx];
    const address =
      userState[user.label].client.account.getUnusedAddress().address;
    await fundWallet(address);
    await sleep(1000);
  }
}
async function generateDashpayProfiles() {
  for (let idx = 0; idx < users.length; idx++) {
    const user = users[idx];
    await generateDashpayProfile(user);
  }
}

async function initIdentities() {
  for (let idx = 0; idx < users.length; idx++) {
    const user = users[idx];
    userState[user.label].identity = await getOrCreateIdentity(
      userState[user.label].client
    );
  }
}

async function main() {
  // Run init and fund first:
  await initWallets();
  await fundWallets();

  // console.log('Waiting 20s to mature wallet funds..')
  await sleep(20000);

  // Once the funding matured, run the rest:
  await initWallets();
  await initIdentities();
  await generateUsers();
  await generateChatMessages();
  await generateDashpayProfiles();
  await generateContactRequests();
}

main();
