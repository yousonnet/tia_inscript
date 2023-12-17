import { Wallet, ethers } from "ethers";
import "dotenv/config";
let node_provider = new ethers.JsonRpcProvider("https://rpc-bsc.48.club");
let data =
  "0x646174613a2c7b2270223a226273632d3230222c226f70223a226d696e74222c227469636b223a22736f6669222c22616d74223a2234227d";

async function main() {
  let keys = process.env.BSC_KEY!.split(",");
  let wallets: any = [];
  for (let i of keys) {
    wallets.push(new ethers.Wallet(i, node_provider));
  }

  while (true) {
    let txs: any[] = [];
    for (let wallet of wallets) {
      let tx = wallet.sendTransaction({
        to: wallet.address,
        data: data,
      });
      txs.push(tx);
    }
    await Promise.all(txs);
  }
}
main();
