# **prereq:**

创建一个.env

ex:

COSMOS_KEY=xxx xxx xxx,xxx xxx xxx

xxx xxx xxx 为助记词,不同 walllet 的助记词中间用,隔开

```
npm install -g typescript
npm install -g ts-node
```

npm i

ts-node "cosmo copy".ts

根据 inscript 的实例修改 memo，和 to:address,必要时提高 gas

自定义 mint 请修改 cosmo copy.ts 里的前几项变量

修改 rpc endpoint
修改 private_key=true 后即可输入私钥在.env 里
修改 pre_fix_name 即为地址前面的链名类似 celestiaxxx，即 prefix_name="celestia"

根据节点的要求修改这里的 amount
const fee = {
amount: [{ denom: "u" + token_name, amount: "2200" }],
gas: "85000",
};
节点的 amount 不够会报错出来，根据错误修改 amount 即可

修改 token name ，例 celestia 就是 tia,cosmos 就是 atom
修改 value_denom_amount 即修改自转的 value ，例 1 atom=1,000,000uatom
个别铭文会索引 tx 里的 value

修改 times，一个 tx 里一个 wallet batch 发送的数量

如果不是自转脚本，请修改 is_self_transfer 里的到指定地址

# **ps:本脚本不适用于 inj**
