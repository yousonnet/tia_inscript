import { Wallet, ethers } from "ethers";
import "dotenv/config";
let node_provider = new ethers.JsonRpcProvider(
  "https://bsc-dataseed1.bnbchain.org"
);
let data =
  "0x646174613a2c7b2270223a226273632d3230222c226f70223a226d696e74222c227469636b223a22736f6669222c22616d74223a2234227d";

async function main() {
  let keys = process.env.BSC_KEY!.split(",");
  let wallets: any = [];
  for (let i of keys) {
    wallets.push(new ethers.Wallet(i, node_provider));
  }
  let counter = 0;
  while (true) {
    let txs: any[] = [];
    for (let wallet of wallets) {
      let tx = wallet.sendTransaction({
        to: wallet.address,
        data: data,
      });
      txs.push(tx);
    }
    await Promise.all(txs)
      .then((res) => {
        counter++;
        console.log(counter);
      })
      .catch((e) => {
        console.log(e);
      });
  }
}
main();
