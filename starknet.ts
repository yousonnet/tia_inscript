import {
  Provider,
  Contract,
  Account,
  ec,
  json,
  constants,
  CallData,
} from "starknet";
import "dotenv/config";
let key = process.env.STARK_KEY!;
let contract_address =
  "0x07341189e3c96f636a4192cfba8c18deeee33a19c5d0425a26cf96ea42388c4e";
async function main() {
  const provider = new Provider({
    sequencer: { network: constants.NetworkName.SN_MAIN },
  });
  const account = new Account(
    provider,
    "0x00a895c39FBC2A32B7de9DA167D1dCd7e820EdaA46b096C6f2c9f97EC3970c4D",
    key,
    "1"
  );
  //   let res = await account.getNonce();
  let res = await account.execute({
    contractAddress: contract_address,
    entrypoint: "inscribe",
    calldata: [
      "63",
      "100",
      "97",
      "116",
      "97",
      "58",
      "44",
      "123",
      "34",
      "112",
      "34",
      "58",
      "34",
      "115",
      "116",
      "97",
      "114",
      "107",
      "45",
      "50",
      "48",
      "34",
      "44",
      "34",
      "111",
      "112",
      "34",
      "58",
      "34",
      "109",
      "105",
      "110",
      "116",
      "34",
      "44",
      "34",
      "116",
      "105",
      "99",
      "107",
      "34",
      "58",
      "34",
      "83",
      "84",
      "65",
      "82",
      "75",
      "73",
      "34",
      "44",
      "34",
      "97",
      "109",
      "116",
      "34",
      "58",
      "34",
      "49",
      "48",
      "48",
      "48",
      "34",
      "125",
    ],
  });
  console.log(res);
  //   const testAddress =
  //     "0xa895c39fbc2a32b7de9da167d1dcd7e820edaa46b096c6f2c9f97ec3970c4d";

  //   // read abi of Test contract
  //   const { abi: testAbi } = await provider.getClassAt(testAddress);
  //   if (testAbi === undefined) {
  //     throw new Error("no abi.");
  //   }
  //   const myTestContract = new Contract(testAbi, testAddress, provider);

  //   // Interaction with the contract with call
  //   const bal1 = await myTestContract.isCairo1();
  //   console.log(bal1); // .res because the return value is called 'res' in the Cairo 0 contract.
  // With Cairo 1 contract, the result value is in bal1, as bigint.
}
main();
