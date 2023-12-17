import axios from "axios";
import {} from "@cosmjs/crypto";
import { SigningStargateClient, StargateClient } from "@cosmjs/stargate";
import { Secp256k1HdWallet, Secp256k1Wallet } from "@cosmjs/amino";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import "dotenv/config";
const rpc_endpoint = "https://celestia-mocha-rpc.publicnode.com:443";
//1 mil denom token = 1 native
const token_name = "tia";
const fee = {
  amount: [{ denom: "u" + token_name, amount: "400" }],
  gas: "80000",
};
const memo = "test2";

let wallet = await Secp256k1HdWallet.fromMnemonic(process.env.COSMOS_KEY!, {
  prefix: "tia",
});
async function main() {
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
      amount: [{ denom: "u" + token_name, amount: "1" }],
    },
  };

  await client.signAndBroadcast(address, [msg], fee, memo);
}

main();
