'use strict'

let CoinNodeObj = require('conf/coinNodeObj.js')
const pu = require("promisefy-util")
const wanUtil = require('wanchain-util');


var Tx = wanUtil.wanchainTx;

let from = ""
let to = ""

// Fill the privateKey's json String
var privateKeyJsonString = ""
if (!true) {
  to = "0x8e08818Baca5eb05CbC549c2B93476A5f03E88D5";
  from = "0xA33A2551995FAeF21292235B135EC1aAd74fb2b2";//"0x9cd8230d43464aE97F60BAD6DE9566a064990E55";//"0xC4F682E30aa722053C52feA538db77e2042F7980"
  privateKeyJsonString = {"type":"Buffer","data":"152e96ab620bcaa3c35d640d8def506f26a1687beee028faa77c1e3239017b48"}
} else {
  from = "0xcf696d8eea08a311780fb89b20d4f0895198a489";//"0x9cd8230d43464aE97F60BAD6DE9566a064990E55";//"0xC4F682E30aa722053C52feA538db77e2042F7980"
  to = "0x9cd8230d43464aE97F60BAD6DE9566a064990E55"
  privateKeyJsonString = '{"type":"Buffer","data":[]}'
}

var privateKey = Buffer.from("152e96ab620bcaa3c35d640d8def506f26a1687beee028faa77c1e3239017b48",'hex');


let gGasLimit = 22000;
let gGasPrice = 200000000000; // 200G

let log = console

let web3Instance = new CoinNodeObj(log, 'wanipc');
let web3 = web3Instance.getClient()

let lastBlock = 0

let totalSendTx = 0;

async function checkBlock() {
  let blockNumber = await pu.promisefy(web3.eth.getBlockNumber, [], web3.eth)
  if (blockNumber != lastBlock) {
    lastBlock = blockNumber
    let block = await pu.promisefy(web3.eth.getBlock, [blockNumber, true], web3.eth)
    log.log(new Date(), ">>>>>>>>>>>>>>>> block ", blockNumber, "has ", block.transactions.length, " txs")
  }

}



function SignTx() {
  var rawTx = {
    Txtype: 0x01,
    nonce: nonce++,
    gasPrice: gGasPrice,
    gasLimit: gGasLimit,
    to: to,
    chainId: 4,
    value: '0x02'
  };
  const tx = new Tx(rawTx);

  tx.sign(privateKey);
  const serializedTx = tx.serialize();
  return "0x" + serializedTx.toString('hex')
}

let startTime = new Date()
let txCount = 1000
let nonce = null
async function main() {
  // while(!nonce) {
  //   web3.eth.getTransactionCount(from, null, (no) => { nonce = no;console.log("nonce:", nonce); });
  //   await pu.sleep(1000)
  // }

  nonce = await  pu.promisefy(web3.eth.getTransactionCount, [from], web3.eth);
  console.log("nonce:", nonce)

  while (1) {
    //checkBlock()
    try {
      let txpoolStatus = await pu.promisefy(web3.txpool.status, [], web3.txpool)
      let pendingNumber = Number(txpoolStatus.pending)
      log.log(new Date(), "pending: ", pendingNumber)
      if (pendingNumber > 80000) {
        await pu.sleep(1000)
        continue
      }
    } catch (err) {
      log.error("web3.txpool.status: ", err)
    }

    let rs = [];
    for (let i = 0; i < txCount; i++) {
      let tx = SignTx()
      let r = pu.promisefy(web3.eth.sendRawTransaction, [tx], web3.eth);
      rs.push(r)
    }
    await Promise.all(rs)
    totalSendTx += txCount
    //await pu.sleep(1000)
    let timePass = new Date() - startTime;

    timePass = timePass / 1000

    log.log(new Date(), "send ", txCount, " txs, total:", totalSendTx, "tps: ", totalSendTx / timePass)
  }

  console.log("done.")
}

main();
