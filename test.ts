import { formatEther, formatUnits } from "ethers";

function hexToString(hex: string): string {
  // 确保十六进制字符串的长度是偶数
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }

  let result = "";

  for (let i = 0; i < hex.length; i += 2) {
    // 将每两个字符转换为一个字节
    const byte = parseInt(hex.substr(i, 2), 16);
    result += String.fromCharCode(byte);
  }

  return result;
}
let string =
  "ZGF0YToseyJvcCI6Im1pbnQiLCJhbXQiOjEwMDAwLCJ0aWNrIjoiY2lhcyIsInAiOiJjaWEtMjAifQ==";
// console.log(hexToString(string));
console.log(formatUnits(2 * 1e9, "gwei"));
