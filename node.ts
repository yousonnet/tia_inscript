import { ethers, Wallet } from "ethers";
import "dotenv/config";

let node_provider = new ethers.JsonRpcProvider("https://rpc.maplabs.io");
let data = "0x";
async function main() {
  let node_blockNumber = await node_provider.getBlockNumber();
  let private_key = process.env.PRIVATE_KEY!;
  let wallet = new ethers.Wallet(private_key, node_provider);
  let nonce = await wallet.getNonce();
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
