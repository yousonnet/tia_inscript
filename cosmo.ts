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
const rpc_endpoint = "https://sentry.tm.injective.network:443";
// import{private}
//1 mil denom token = 1 native
let tia_keys = process.env.COSMOS_KEY!.split(",");
const pre_fix_name = "inj";
const token_name = "tia";
const fee = {
  amount: [{ denom: "u" + token_name, amount: "400" }],
  gas: "95000",
};
const memo =
  "ZGF0YToseyJvcCI6Im1pbnQiLCJhbXQiOjEwMDAwLCJ0aWNrIjoiY2lhcyIsInAiOiJjaWEtMjAifQ==";
const value_amount_denom = "1";
const times = 2;
const is_private_key = false;

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
    // const inj_endpoint = getNetworkEndpoints(Network.Mainnet);
    // const indexerGrpcAccountApi = new IndexerGrpcAccountPortfolioApi(
    //   inj_endpoint.indexer
    // );
    const tendermint_client = new Tendermint34Client(rpc_endpoint);
    const client_inj = new InjectiveStargateClient(rpc_endpoint);
    // let sequence = (await client.getSequence(address)).sequence;
    let sequence = await indexerGrpcAccountApi.fetchAccountPortfolio(address);
    console.log(sequence);
    // seprate_signer_by_wallets.push({ client, address, wallet, sequence });
  }

  // let counter = 0;
  // while (true) {
  //   let promises: Promise<string | null>[] = [];
  //   for (let signer of seprate_signer_by_wallets) {
  //     const msg = {
  //       typeUrl: "/cosmos.bank.v1beta1.MsgSend",
  //       value: {
  //         fromAddress: signer.address,
  //         toAddress: signer.address,
  //         amount: [{ denom: "u" + token_name, amount: value_amount_denom }],
  //       },
  //     };
  //     for (let i = 0; i < times; i++) {
  //       promises.push(
  //         signer.client
  //           .signAndBroadcastSyncWithSequence(
  //             signer.address,
  //             [msg],
  //             fee,
  //             signer.sequence,
  //             memo
  //           )
  //           // signAndBroadcast(signer.address, [msg], fee, memo)
  //           .catch(async (e) => {
  //             if (e.message.includes("account sequence mismatch")) {
  //               signer.sequence = await signer.client
  //                 .getSequence(signer.address)
  //                 .then((res: SequenceResponse) => res.sequence);
  //               console.log("recatch sequence");
  //             }
  //             console.log(e);
  //             return null;
  //           })
  //       );
  //       signer.sequence++;
  //     }
  //     // console.log("pass in");
  //   }
  //   console.time();
  //   await Promise.all(promises).then((array) => {
  //     for (let i = 0; i < array.length; i++) {
  //       if (array[i] !== null) {
  //         counter++;
  //         console.log("mint:", counter);
  //       }
  //     }
  //   });
  //   console.timeEnd();
  // }
}

main();
