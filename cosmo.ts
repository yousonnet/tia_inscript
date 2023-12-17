import {
  DeliverTxResponse,
  SigningStargateClient,
  StargateClient,
  SequenceResponse,
} from "@cosmjs/stargate";
import { Secp256k1HdWallet, Secp256k1Wallet } from "@cosmjs/amino";
import "dotenv/config";
const rpc_endpoint = "https://rpc-2.celestia.nodes.guru";
import { makeAuthInfoBytes } from "@cosmjs/proto-signing";
// import {}
//1 mil denom token = 1 native
let tia_keys = process.env.COSMOS_KEY!.split(",");
const pre_fix_name = "celestia";
const token_name = "tia";
const fee = {
  amount: [{ denom: "u" + token_name, amount: "200" }],
  gas: "95000",
};
const memo = "";
const value_amount_denom = "1";

async function main() {
  let seprate_signer_by_wallets: {
    client: SigningStargateClient;
    address: string;
    wallet: Secp256k1HdWallet;
  }[] = [];
  // let counter:{[key:string]:number} =[];
  for (let key of tia_keys) {
    // let wallet = await Secp256k1HdWallet.fromMnemonic(, {
    //   prefix: "celestia",
    // });
    const wallet = await Secp256k1HdWallet.fromMnemonic(key, {
      prefix: pre_fix_name,
    });
    // const base64String = key;
    // const buffer = Buffer.from(base64String, "utf-8");
    // const uint8Array = new Uint8Array(buffer);
    // const wallet = await Secp256k1Wallet.fromKey(uint8Array, "celestia");
    let address = (await wallet.getAccounts())[0].address;
    const client = await SigningStargateClient.connectWithSigner(
      rpc_endpoint,
      wallet
    );
    seprate_signer_by_wallets.push({ client, address, wallet });
  }

  let counter = 0;
  while (true) {
    let promises: Promise<DeliverTxResponse | null>[] = [];
    for (let signer of seprate_signer_by_wallets) {
      const msg = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: {
          fromAddress: signer.address,
          toAddress: signer.address,
          amount: [{ denom: "u" + token_name, amount: value_amount_denom }],
        },
      };
      // signer.client.broadcastTx(tx)
      promises.push(
        signer.client
          .signAndBroadcast(signer.address, [msg], fee, memo)
          .catch((e) => {
            // console.log("one send error");
            return null;
          })
      );
      // console.log("pass in");
    }
    console.time();
    await Promise.all(promises).then((array) => {
      for (let i = 0; i < array.length; i++) {
        if (array[i] !== null) {
          counter++;
          console.log("mint:", counter);
        }
      }
    });
    console.timeEnd();
  }
}

main();
