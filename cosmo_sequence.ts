import {
  DirectSecp256k1HdWallet,
  Registry,
  makeAuthInfoBytes,
  makeSignDoc,
  TxBodyEncodeObject,
  EncodeObject,
  OfflineDirectSigner,
  encodePubkey,
} from "@cosmjs/proto-signing";
import { Pubkey } from "@cosmjs/amino";
import { SigningStargateClient, coins } from "@cosmjs/stargate";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { TxBody } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { Any } from "cosmjs-types/google/protobuf/any";
import { decodeTxRaw } from "@cosmjs/proto-signing";
// import{}
// import {SignMode}
async function sendAtom() {
  const rpcEndpoint = "YOUR_RPC_ENDPOINT";
  const mnemonic = "YOUR_MNEMONIC";
  const chainId = "YOUR_CHAIN_ID";
  const accountNumber: number = "YOUR_ACCOUNT_NUMBER"; // 替换为您的账户编号
  const sequence = Number("YOUR_SEQUENCE"); // 替换为您的序列号

  // 创建钱包
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
  const [account] = await wallet.getAccounts();

  // 构建交易
  const msgSend = {
    typeUrl: "/cosmos.bank.v1beta1.MsgSend",
    value: {
      fromAddress: "cosmos1...",
      toAddress: "cosmos1...",
      amount: coins(1000000, "uatom"),
    },
  };
  const fee = {
    amount: coins(2000, "uatom"),
    gas: "180000",
  };

  // 创建 TxBody
  const txBody = TxBody.fromPartial({
    messages: [
      Any.fromPartial({
        typeUrl: msgSend.typeUrl,
        value: MsgSend.encode(msgSend.value).finish(),
      }),
    ],
    memo: "Some memo",
  });

  // 创建 AuthInfo
  const pubkeyAny = Any.fromPartial({
    typeUrl: "/cosmos.crypto.secp256k1.PubKey",
    value: account.pubkey,
  });
  const signers = [{ pubkey: pubkeyAny, sequence: sequence }];
  const authInfoBytes = makeAuthInfoBytes(
    signers,
    fee.amount,
    parseInt(fee.gas),
    undefined,
    undefined
  );
  const body_bytes = TxBody.encode(txBody).finish();
  // 创建 SignDoc
  const chainId = "cosmoshub-4";
  const accountNumber = 0;
  const signDoc = makeSignDoc(
    body_bytes,
    authInfoBytes,
    chainId,
    accountNumber
  );
  const { signed, signature } = await wallet.signDirect(
    account.address,
    signDoc
  );

  // 广播交易
}
