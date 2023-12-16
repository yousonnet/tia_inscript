import { ethers, Wallet } from "ethers";
import "dotenv/config";

let node_provider = new ethers.JsonRpcProvider(
  "https://cronos-evm.publicnode.com"
);
let data =
  "0x646174613a2c7b2270223a226372632d3230222c226f70223a226d696e74222c227469636b223a2263726f73222c22616d74223a2231303030227d";
async function main() {
  let node_blockNumber = await node_provider.getBlockNumber();
  console.log("node_blockNumber", node_blockNumber);
  let private_key = process.env.PRIVATE_KEY!;
  let wallet = new ethers.Wallet(private_key, node_provider);
  let nonce = await wallet.getNonce();
  console.log(nonce);
  while (true) {
    try {
      let transaction = {
        to: wallet.address,
        nonce,
        data,
        value: 0n,
      };
      await wallet.sendTransaction(transaction);
      nonce++;
      await sleepWhile(200);
      console.log(nonce);
    } catch (e) {
      nonce = await wallet.getNonce();
    }
  }
  //   console.log("nonce", nonce);
}

main();
async function sleepWhile(ms: number) {
  return await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
