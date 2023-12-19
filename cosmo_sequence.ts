import {
  DirectSecp256k1HdWallet,
  Registry,
  makeSignDoc,
  makeAuthInfoBytes,
  makeSignBytes,
  isOfflineDirectSigner,
  EncodeObject,
  OfflineSigner,
  encodePubkey,
  // anyToSinglePubkey
} from "@cosmjs/proto-signing";
import { AminoTypes } from "@cosmjs/stargate";
import { fromBase64 } from "@cosmjs/encoding";
import { assert, assertDefined } from "@cosmjs/utils";
import {
  OfflineAminoSigner,
  decodeSignature,
  makeSignDoc as makeSignDocAmino,
} from "@cosmjs/amino";
import { decodeAminoPubkey } from "@cosmjs/amino";
import { decodeTxRaw } from "@cosmjs/proto-signing";
import {
  defaultRegistryTypes,
  createDefaultAminoConverters,
} from "@cosmjs/stargate";
import { connectComet } from "@cosmjs/tendermint-rpc";
import { TxBody } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import {
  coins,
  GasPrice,
  StargateClient,
  SigningStargateClient,
  StdFee,
  SignerData,
  SigningStargateClientOptions,
  defaultRegistryTypes as defaultStargateTypes,
} from "@cosmjs/stargate";
import { SignMode } from "cosmjs-types/cosmos/tx/signing/v1beta1/signing";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import "dotenv/config";
import { CometClient } from "@cosmjs/tendermint-rpc";
import { encodeSecp256k1Pubkey } from "@cosmjs/amino";
import { TxBodyEncodeObject } from "@cosmjs/proto-signing";
import { Int53 } from "@cosmjs/math";
class CustomSigningStargateClient extends SigningStargateClient {
  // public override signer:OfflineSigner;
  protected readonly not_private_signer: OfflineSigner;
  protected readonly not_private_aminoTypes: AminoTypes;
  constructor(
    cometClient: CometClient | undefined,
    signer: OfflineSigner,
    options: SigningStargateClientOptions
  ) {
    super(cometClient, signer, options);
    this.not_private_signer = signer;
    const {
      registry = new Registry(defaultRegistryTypes),
      aminoTypes = new AminoTypes(createDefaultAminoConverters()),
    } = options;
    this.not_private_aminoTypes = aminoTypes;
  }
  // public static async connectWithSigner(
  //   endpoint: string | HttpEndpoint,
  //   signer: OfflineSigner,
  //   options: SigningStargateClientOptions = {},
  // ): Promise<SigningStargateClient> {
  //   const cometClient = await connectComet(endpoint);
  //   return SigningStargateClient.createWithSigner(cometClient, signer, options);
  // }

  /**
   * Creates an instance from a manually created Comet client.
   * Use this to use `Comet38Client` or `Tendermint37Client` instead of `Tendermint34Client`.
   */
  public static async alter_createWithSigner(
    endpoint: string,
    // cometClient: CometClient,
    signer: OfflineSigner,
    options: SigningStargateClientOptions = {}
  ): Promise<CustomSigningStargateClient> {
    const cometClient = await connectComet(endpoint);
    return new CustomSigningStargateClient(cometClient, signer, options);
  }
  public async signAndBroadcastSyncWithSequence(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee,
    sequence: number,
    memo: string,
    timeoutHeight?: bigint | undefined
  ): Promise<string> {
    let usedFee: StdFee;
    // if (fee == "auto" || typeof fee === "number") {
    //   assertDefined(this.gasPrice, "Gas price must be set in the client options when auto gas is used.");
    //   const gasEstimation = await this.simulate(signerAddress, messages, memo);
    //   const multiplier = typeof fee === "number" ? fee : 1.3;
    //   usedFee = calculateFee(Math.round(gasEstimation * multiplier), this.gasPrice);
    // } else {
    usedFee = fee;
    // }
    const txRaw = await this.signWithSequenceAppointed(
      signerAddress,
      messages,
      usedFee,
      memo,
      sequence,
      undefined,
      timeoutHeight
    );
    const txBytes = TxRaw.encode(txRaw).finish();
    return this.broadcastTxSync(txBytes);
  }
  public async signWithSequenceAppointed(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee,
    memo: string,
    sequence_appointed: number,
    explicitSignerData?: SignerData,
    timeoutHeight?: bigint
  ): Promise<TxRaw> {
    let signerData: SignerData;
    if (explicitSignerData) {
      signerData = explicitSignerData;
    } else {
      let { accountNumber, sequence } = await this.getSequence(signerAddress);
      sequence = sequence_appointed;
      const chainId = await this.getChainId();
      signerData = {
        accountNumber: accountNumber,
        sequence: sequence,
        chainId: chainId,
      };
    }
    //只有DirectSigner？
    return isOfflineDirectSigner(this.not_private_signer)
      ? this.alter_signDirect(
          signerAddress,
          messages,
          fee,
          memo,
          signerData,
          timeoutHeight
        )
      : this.alter_signAmino(
          signerAddress,
          messages,
          fee,
          memo,
          signerData,
          timeoutHeight
        );
  }
  public async alter_signDirect(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee,
    memo: string,
    { accountNumber, sequence, chainId }: SignerData,
    timeoutHeight?: bigint
  ): Promise<TxRaw> {
    assert(isOfflineDirectSigner(this.not_private_signer));
    const accountFromSigner = (
      await this.not_private_signer.getAccounts()
    ).find((account) => account.address === signerAddress);
    if (!accountFromSigner) {
      throw new Error("Failed to retrieve account from signer");
    }
    const pubkey = encodePubkey(
      encodeSecp256k1Pubkey(accountFromSigner.pubkey)
    );
    const txBodyEncodeObject: TxBodyEncodeObject = {
      typeUrl: "/cosmos.tx.v1beta1.TxBody",
      value: {
        messages: messages,
        memo: memo,
        timeoutHeight: timeoutHeight,
      },
    };
    const txBodyBytes = this.registry.encode(txBodyEncodeObject);
    const gasLimit = Int53.fromString(fee.gas).toNumber();
    const authInfoBytes = makeAuthInfoBytes(
      [{ pubkey, sequence }],
      fee.amount,
      gasLimit,
      fee.granter,
      fee.payer
    );
    const signDoc = makeSignDoc(
      txBodyBytes,
      authInfoBytes,
      chainId,
      accountNumber
    );
    const { signature, signed } = await this.not_private_signer.signDirect(
      signerAddress,
      signDoc
    );
    return TxRaw.fromPartial({
      bodyBytes: signed.bodyBytes,
      authInfoBytes: signed.authInfoBytes,
      signatures: [fromBase64(signature.signature)],
    });
  }
  public async alter_signAmino(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee,
    memo: string,
    { accountNumber, sequence, chainId }: SignerData,
    timeoutHeight?: bigint
  ): Promise<TxRaw> {
    assert(!isOfflineDirectSigner(this.not_private_signer));
    const accountFromSigner = (
      await this.not_private_signer.getAccounts()
    ).find((account) => account.address === signerAddress);
    if (!accountFromSigner) {
      throw new Error("Failed to retrieve account from signer");
    }
    const pubkey = encodePubkey(
      encodeSecp256k1Pubkey(accountFromSigner.pubkey)
    );
    const signMode = SignMode.SIGN_MODE_LEGACY_AMINO_JSON;
    const msgs = messages.map((msg) =>
      this.not_private_aminoTypes.toAmino(msg)
    );
    const signDoc = makeSignDocAmino(
      msgs,
      fee,
      chainId,
      memo,
      accountNumber,
      sequence,
      timeoutHeight
    );
    const { signature, signed } = await this.not_private_signer.signAmino(
      signerAddress,
      signDoc
    );
    const signedTxBody = {
      messages: signed.msgs.map((msg) =>
        this.not_private_aminoTypes.fromAmino(msg)
      ),
      memo: signed.memo,
      timeoutHeight: timeoutHeight,
    };
    const signedTxBodyEncodeObject: TxBodyEncodeObject = {
      typeUrl: "/cosmos.tx.v1beta1.TxBody",
      value: signedTxBody,
    };
    const signedTxBodyBytes = this.registry.encode(signedTxBodyEncodeObject);
    const signedGasLimit = Int53.fromString(signed.fee.gas).toNumber();
    const signedSequence = Int53.fromString(signed.sequence).toNumber();
    const signedAuthInfoBytes = makeAuthInfoBytes(
      [{ pubkey, sequence: signedSequence }],
      signed.fee.amount,
      signedGasLimit,
      signed.fee.granter,
      signed.fee.payer,
      signMode
    );
    return TxRaw.fromPartial({
      bodyBytes: signedTxBodyBytes,
      authInfoBytes: signedAuthInfoBytes,
      signatures: [fromBase64(signature.signature)],
    });
  }
}
export { CustomSigningStargateClient };
// const memo = "";
