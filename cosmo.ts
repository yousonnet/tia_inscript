import {
  DeliverTxResponse,
  SigningStargateClient,
  StargateClient,
  SequenceResponse,
} from "@cosmjs/stargate";
import { CustomSigningStargateClient } from "./cosmo_sequence";
import { Secp256k1HdWallet, Secp256k1Wallet } from "@cosmjs/amino";
import "dotenv/config";
const rpc_endpoint = "https://rpc-2.celestia.nodes.guru";

//1 mil denom token = 1 native
let tia_keys = process.env.COSMOS_KEY!.split(",");
const pre_fix_name = "celestia";
const token_name = "tia";
const fee = {
  amount: [{ denom: "u" + token_name, amount: "400" }],
  gas: "95000",
};
const memo =
  "ZGF0YToseyJvcCI6Im1pbnQiLCJhbXQiOjEwMDAwLCJ0aWNrIjoiY2lhcyIsInAiOiJjaWEtMjAifQ==";
const value_amount_denom = "1";
const times = 2;

async function main() {
  let seprate_signer_by_wallets: {
    client: CustomSigningStargateClient;
    address: string;
    wallet: Secp256k1HdWallet;
    sequence: number;
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

    const client = await CustomSigningStargateClient.alter_createWithSigner(
      rpc_endpoint,
      wallet
    );
    let sequence = (await client.getSequence(address)).sequence;
    seprate_signer_by_wallets.push({ client, address, wallet, sequence });
  }

  let counter = 0;
  while (true) {
    let promises: Promise<string | null>[] = [];
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
      for (let i = 0; i < times; i++) {
        promises.push(
          signer.client
            .signAndBroadcastSyncWithSequence(
              signer.address,
              [msg],
              fee,
              signer.sequence,
              memo
            )
            // signAndBroadcast(signer.address, [msg], fee, memo)
            .catch(async (e) => {
              if (e.message.includes("account sequence mismatch")) {
                signer.sequence = await signer.client
                  .getSequence(signer.address)
                  .then((res: SequenceResponse) => res.sequence);
                console.log("recatch sequence");
              }
              console.log(e);
              return null;
            })
        );
        signer.sequence++;
      }
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
