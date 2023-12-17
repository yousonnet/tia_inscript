import {
  DeliverTxResponse,
  SigningStargateClient,
  StargateClient,
} from "@cosmjs/stargate";
import { Secp256k1HdWallet, Secp256k1Wallet } from "@cosmjs/amino";
import "dotenv/config";
const rpc_endpoint = "https://rpc-2.celestia.nodes.guru";
//1 mil denom token = 1 native
let tia_keys = process.env.COSMOS_KEY!.split(",");
const token_name = "tia";
const fee = {
  amount: [{ denom: "u" + token_name, amount: "400" }],
  gas: "95000",
};
const memo = "";

async function main() {
  let wallets: Secp256k1HdWallet[] = [];
  for (let key of tia_keys) {
    // let wallet = await Secp256k1HdWallet.fromMnemonic(, {
    //   prefix: "celestia",
    // });
    const wallet = await Secp256k1HdWallet.fromMnemonic(key, {
      prefix: "celestia",
    });
    wallets.push(wallet);
  }
  while (true) {
    let promises: Promise<DeliverTxResponse>[] = [];
    for (let wallet of wallets) {
      let address = (await wallet.getAccounts())[0].address;
      const client = await SigningStargateClient.connectWithSigner(
        rpc_endpoint,
        wallet
      );
      const msg = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: {
          fromAddress: address,
          toAddress: address,
          amount: [{ denom: "u" + token_name, amount: "0" }],
        },
      };
      promises.push(client.signAndBroadcast(address, [msg], fee, memo));
    }
    await Promise.all(promises);
  }
}

main();
