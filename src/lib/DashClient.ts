import Dash from "dash";
import { Client } from "dash/dist/src/SDK/Client/index";
import { strict as assert } from "assert";
import localforage from "localforage";

let client: Client | undefined;
let identityId: string | undefined; // TODO replace string with Identifier
let identity: any | undefined; // TODO replace any with Identity

const disconnectClient = async function() {
  assert(client, "Error: Client is not initialized!");

  await client.disconnect();

  client = undefined;
  identity = undefined;
  identityId = undefined;

  return; // TODO handle errors
};

const getClient = function() {
  assert(client, "Error: Client is not initialized!");

  // assert(client.wallet, "Error: Client is initialized without a wallet!");

  return client;
};

const getClientOpts = function(mnemonic: string | null | undefined) {
  const clientOpts: any = {
    network: "testnet",
    apps: {
      dashpayWallet: {
        contractId:
          process.env.VUE_APP_DASHPAY_WALLET_CONTRACT_ID_local ||
          process.env.VUE_APP_DASHPAY_WALLET_CONTRACT_ID_testnet ||
          process.env.VUE_APP_DASHPAY_WALLET_CONTRACT_ID_build_testnet,
      },
    },
  };

  const envRun = process.env.VUE_APP_ENV_RUN || "";

  if (!["testnet", "build_testnet"].includes(envRun)) {
    clientOpts.dapiAddresses = JSON.parse(process.env.VUE_APP_DAPIADDRESSES!);

    clientOpts.apps.dpns = { contractId: process.env.VUE_APP_DPNS_CONTRACT_ID };

    clientOpts.apps.dashpay = {
      contractId: process.env.VUE_APP_DASHPAY_CONTRACT_ID,
    };
  }

  if (mnemonic || mnemonic === null) {
    (clientOpts as any).wallet = {
      mnemonic,
      adapter: localforage,
      // offlineMode: true,
      // unsafeOptions: {
      //   skipSynchronizationBeforeHeight: 639373,
      // },
    };
  }

  return clientOpts;
};

const setClientIdentity = function(newIdentity: any): void {
  identity = newIdentity;
  identityId = newIdentity.getId();
};

const fetchClientIdentity = async function() {
  console.log("fetchClientIdentity identity :>> ", identity);
  // if (identity) return identity; // Deprecated, Always fetch, otherwise use getClientIdentity()

  identityId = (client?.account as any).identities.getIdentityIds()[0];

  // identityId = "Bxq3AxmzSaBPvr4kTc2W8ewDg8AZuNoVRYvTBssYpEP4"; // TODO TEMP this is a workaround for slow testnet

  console.log("identityId :>> ", identityId);

  if (identityId) identity = await client?.platform?.identities.get(identityId);
  if (identity) console.log("identity.balance:>> ", identity.balance);

  return identity;
};

const initClient = async function(clientOpts: any) {
  // TODO handle errors
  assert(!client, "Error: Client already initialized!");

  // assert(clientOpts.wallet, "Error: clientOpts is missing wallet config!");

  console.log("clientOpts :>> ", clientOpts);

  client = new Dash.Client(clientOpts);

  console.log("client :>> ", client);
  Object.entries((client.getApps() as any).apps).forEach(([name, entry]) =>
    console.log(name, (entry as any).contractId.toString())
  );

  if (client.wallet) {
    console.log("client, init wallet");
    const startWalletInit = Date.now();
    client.account = await client.getWalletAccount();
    const startFetchIdentity = Date.now();
    console.log(
      "client, finished wallet init in:",
      Math.floor((startFetchIdentity - startWalletInit) / 1000),
      "s"
    );
    console.log("Wallet init balance", client.account!.getTotalBalance());

    console.log("client, fetch identity");

    await fetchClientIdentity();

    console.log(
      "client, finished fetch identity in:",
      Math.floor((Date.now() - startFetchIdentity) / 1000),
      "s"
    );
  }
  console.log("returning client");

  return getClient();
};

const getClientIdentity = function() {
  console.log("identity :>> ", identity);
  console.log("identity.getId() :>> ", identity.getId());
  return identity;
};

const clientHasWallet = function() {
  return !!getClient().wallet;
};

const initClientWithNewMnemonic = async function() {
  try {
    await disconnectClient();
  } catch (e) {
    console.log(e);
  }
  const clientOpts = getClientOpts(null);

  await initClient(clientOpts);
};

export {
  initClient,
  getClient,
  getClientOpts,
  fetchClientIdentity,
  setClientIdentity,
  getClientIdentity,
  disconnectClient,
  clientHasWallet,
  initClientWithNewMnemonic,
};
