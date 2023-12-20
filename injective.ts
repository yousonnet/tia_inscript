import {
  PrivateKey,
  PublicKey,
  InjectiveEthSecp256k1Wallet,
  MsgBroadcasterWithPk,
  ChainRestAuthApi,
  MsgSend,
  createTransaction,
  DEFAULT_STD_FEE,
  TxGrpcApi,
  TxGrpcClient,
  TxResponse,
  // TxRp
} from "@injectivelabs/sdk-ts";
import { BigNumberInBase } from "@injectivelabs/utils";
import {
  Network,
  getNetworkEndpoints,
  getNetworkChainInfo,
  getNetworkInfo,
} from "@injectivelabs/networks";
import "dotenv/config";

const value_amount = {
  amount: new BigNumberInBase(0.000001).toWei().toFixed(),
  denom: "inj",
};
const memo = "";
const times = 2;

let mnemonics = process.env.COSMOS_KEY!.split(",");
let signers_: { client: MsgBroadcasterWithPk; address: string }[] =
  mnemonics.map((i) => {
    return {
      client: new MsgBroadcasterWithPk({
        privateKey: PrivateKey.fromMnemonic(i),
        network: Network.Mainnet,
      }),
      address: PrivateKey.fromMnemonic(i).toAddress().address,
    };
  });

async function main() {
  const rest_api_client = getNetworkInfo(Network.Mainnet);
  const chain_rest_auth_api = new ChainRestAuthApi(rest_api_client.rest);
  const grpc_service = new TxGrpcClient(rest_api_client.grpc);
  let account_detials = signers_.map(async (i) => {
    return await chain_rest_auth_api.fetchAccount(i.address);
  });
  let accounts_detail = await Promise.all(account_detials);

  const signers = signers_.map((i, index) => {
    return {
      // client: new MsgBroadcasterWithPk({
      //   privateKey: PrivateKey.fromMnemonic(mnemonics[index]),
      //   network: Network.Mainnet,
      // }),
      private_key_sign: PrivateKey.fromMnemonic(mnemonics[index]),
      address: PrivateKey.fromMnemonic(mnemonics[index]).toAddress().address,
      account_detials: accounts_detail[index].account.base_account,
    };
  });
  let txs_promise: Promise<TxResponse>[] = [];
  // console.log(signers);
  while (true) {
    for (let i of signers) {
      for (let ii = 0; ii < times; ii++) {
        let msg = MsgSend.fromJSON({
          amount: [value_amount],
          srcInjectiveAddress: i.address,
          dstInjectiveAddress: i.address,
        });
        let { signBytes, txRaw } = createTransaction({
          message: msg,
          memo,
          fee: DEFAULT_STD_FEE,
          pubKey: i.account_detials.pub_key.key,
          accountNumber: parseInt(i.account_detials.account_number, 10),
          sequence: parseInt(i.account_detials.sequence, 10),
          chainId: rest_api_client.chainId,
        });
        let signature = await i.private_key_sign.sign(Buffer.from(signBytes));
        txRaw.signatures = [signature];
        console.log(grpc_service);
        let tx_promise = grpc_service.broadcast(txRaw);
        txs_promise.push(tx_promise);
        console.log(tx_promise);
        i.account_detials.sequence = i.account_detials.sequence + 1;
        break;
      }
    }
    console.log("waiting for tx response");
    let txs = await Promise.all(txs_promise);
    console.log(txs);
  }
}

main();
