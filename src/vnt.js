const Vnt = require("vnt");
const vntkit = require("vnt-kit");
const Tx = require("ethereumjs-tx");
const fs = require("fs");

let contractAddress = "0x28e463335b3c68a5ed9c27ff3c17b03e77d36627"

console.log("连接RPC服务器...")
const vnt = new Vnt();
vnt.setProvider(new vnt.providers.HttpProvider("http://47.111.100.232:8880"));
console.log("正在解析密钥...")
let keyFile = "./key"
let keyPassword = ""
let keyContent = fs.readFileSync(keyFile).toString("utf-8")
let account = vntkit.account.decrypt(keyContent, keyPassword, false)
console.log("读取合约API...")
let abiFile = "./contract.abi"
let abiContent = fs.readFileSync(abiFile).toString("utf-8")
let abi = JSON.parse(abiContent)
let contract = vnt.core.contract(abi)

function transfer(methodName, args) {
    let data = contract.packFunctionData(methodName, args);

    let nonce = vnt.core.getTransactionCount(account.address);

    let options = {
        to: contractAddress,
        nonce: vnt.toHex(nonce),
        gasPrice: vnt.toHex(30000000000),
        gasLimit: vnt.toHex(300000),
        value: '0x00',
        data: data,
        chainId: 2
    }

    let tx = new Tx(options);
    tx.sign(Buffer.from(account.privateKey.substring(2,), "hex"));

    let serializedTx = tx.serialize();

    return new Promise((resolve, reject) => {
        vnt.core.sendRawTransaction('0x' + serializedTx.toString('hex'),
            function (err, txHash) {
                if (err) {
                    reject(err.toString())
                } else {
                    checkReceipt(3000, txHash)
                        .then(() => resolve(txHash))
                        .catch((error) => reject(error.toString()))
                }
            });
    })
}

function call(methodName, args) {
    let data = contract.packFunctionData(methodName, args);
    let options = {
        to: contractAddress,    // 该字段为合约地址
        data: data           // 该字段为合约调用的data
    }

    let result = vnt.core.call(options)

    return contract.unPackOutput(methodName, result).toString()
}

function checkReceipt(timeout, hash) {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                if (!vnt.core.getTransactionReceipt(hash)) {
                    if (timeout <= 250) {
                        reject(new Error("VNT Chain sync timeout"))
                    } else {
                        checkReceipt(timeout - 250, hash).then(() => resolve()).catch((error) => reject(error))
                    }
                } else {
                    resolve()
                }
            } catch (err) {
                if (timeout <= 250) {
                    reject(new Error("VNT Chain sync timeout"))
                } else {
                    checkReceipt(timeout - 250, hash).then(() => resolve()).catch((error) => reject(error))
                }
            }
        }, 250)
    })
}

function watch(res, eventName) {
    let event = contract.at(contractAddress)[eventName]();
    if (event == null) {
        throw new Error("event is not existed")
    }
    event.watch(function (error, result) {
        if (!error) {
            res.send(JSON.stringify(result))
        }
    });

    res.on("close", () => {
        event.stopWatching()
    })
}


module.exports = {
    transfer,
    call,
    watch
}
