import {
  DeliverTxResponse,
  SigningStargateClient,
  StargateClient,
  SequenceResponse,
} from "@cosmjs/stargate";
import { CustomSigningStargateClient } from "./cosmo_sequence";
import { Secp256k1HdWallet, Secp256k1Wallet } from "@cosmjs/amino";
import "dotenv/config";
import { encodeAminoPubkey } from "@cosmjs/amino";
import { stringToPath } from "@cosmjs/crypto";
import {
  IndexerGrpcAccountPortfolioApi,
  InjectiveStargate,
  injectiveAccountParser,
} from "@injectivelabs/sdk-ts";
import { InjectiveStargateClient } from "@injectivelabs/sdk-ts/dist/cjs/core/stargate";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { getNetworkEndpoints, Network } from "@injectivelabs/networks";

const rpc_endpoint = "https://cosmos-rpc.publicnode.com:443";
// import{private}
//1 mil denom token = 1 native
let tia_keys = process.env.COSMOS_KEY!.split(",");
const pre_fix_name = "cosmos";
const token_name = "atom";
const fee = {
  amount: [{ denom: "u" + token_name, amount: "2200" }],
  gas: "85000",
};
const memo = "urn:cft20:cosmoshub-4@v1;mint$tic=ROIDS,amt=1000000000";
const value_amount_denom = "1";
const times = 10;
const is_private_key = false;
const is_self_transfer = "";
//默认为自转

async function main() {
  let seprate_signer_by_wallets: {
    client: CustomSigningStargateClient;
    address: string;
    wallet: Secp256k1HdWallet | Secp256k1Wallet;
    sequence: number;
  }[] = [];
  const network = await (
    await StargateClient.connect(rpc_endpoint)
  ).getChainId();
  console.log(network);
  for (let key of tia_keys) {
    const wallet = is_private_key
      ? await Secp256k1Wallet.fromKey(Buffer.from(key), pre_fix_name)
      : await Secp256k1HdWallet.fromMnemonic(key, {
          prefix: pre_fix_name,
        });

    let address = (await wallet.getAccounts())[0].address;
    console.log(address);
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
          toAddress:
            is_self_transfer === "" ? signer.address : is_self_transfer,
          amount: [{ denom: "u" + token_name, amount: value_amount_denom }],
        },
      };
      counter++;
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
