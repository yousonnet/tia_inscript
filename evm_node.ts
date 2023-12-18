import {
  FeeData,
  TransactionResponse,
  Wallet,
  ethers,
  formatUnits,
} from "ethers";
import "dotenv/config";
let node_provider = new ethers.JsonRpcProvider("https://rpc.gnosischain.com");
let data =
  "0x646174613a2c7b2270223a226173632d3230222c226f70223a226d696e74222c227469636b223a2242454547222c22616d74223a2231303030227d";
let times = 10;

async function main() {
  let keys = process.env.BSC_KEY!.split(",");
  let addresses: { wallet: Wallet; nonce: number }[] = [];
  for (let i of keys) {
    let wallet = new ethers.Wallet(i, node_provider);
    let nonce = await wallet.getNonce();
    addresses.push({ wallet, nonce });
  }
  let feedata: FeeData = await node_provider.getFeeData();
  console.log(feedata);
  let counter = 0;
  while (true) {
    let txs: Promise<TransactionResponse>[] = [];
    //  let maxPriorityFeePerGas = (feedata.maxPriorityFeePerGas as bigint)+BigInt(times)
    for (let index = 0; index < addresses.length; index++) {
      for (let i = times; i > 0; i = i - 1) {
        let tx = addresses[index].wallet
          .sendTransaction({
            to: addresses[index].wallet.address,
            data: data,
            // gasLimit: 50000,
            // gasPrice: 10,
            value: 0,
            // gasPrice: feedata.gasPrice,
            maxFeePerGas: feedata.maxFeePerGas,
            maxPriorityFeePerGas: feedata.maxPriorityFeePerGas,
            // maxPriorityFeePerGas: Number(i * 1e9).toFixed(0),
            nonce: addresses[index].nonce,
          })
          .catch(async (e) => {
            addresses[index].nonce = await addresses[index].wallet.getNonce();
            return e;
          });
        addresses[index].nonce++;
        txs.push(tx);
      }
    }
    await Promise.all(txs)
      .then((res) => {
        counter++;
        console.log(counter);
      })
      .catch((e) => {
        console.log("err");
      });
  }
}
main();
