async function main() {

    let express = require("express")
    let bodyParser = require('body-parser')
    let vnt = require("./vnt/vnt")
    let riskController = require("./risk_controller/riskController")
    await riskController.init()
    let app = express()
    let port = 3000

    app.use(bodyParser.urlencoded({extended: false}))
    app.use(bodyParser.json())

    app.all("/isConnected", (req, res) => {
        res.send("connected")
    })

    app.all("/login", (req, res) => {
        res.send("logined")
    })

    app.all("/transfer", async (req, res) => {
        let body = req.body
        let index = 0
        let args = []
        while (body["args[" + index + "]"]) {
            args.push(body["args[" + index + "]"])
            index++
        }
        try {
            let txHash = await vnt.transfer(req.body.methodName, args)
            res.send({
                "txHash": txHash
            })
            if (req.body.methodName === "uploadCertification") {
                riskController.saveHash(args[0])
            }
        } catch (err) {
            res.status(500)
            res.send(err)
        }
    })

    app.all("/call", async (req, res) => {
        let body = req.body
        let index = 0
        let args = []
        while (body["args[" + index + "]"]) {
            args.push(body["args[" + index + "]"])
            index++
        }

        try {
            res.send(vnt.call(body.methodName, args))
        } catch (err) {
            res.status(500)
            res.send(err)
        }


    })

    app.all("/watch", async (req, res) => {
        let body = req.body

        vnt.watch(res, body.eventName)
    })


    app.all("/getBalance", (req, res) => {
        res.send({
            balance: Number(vnt.getBalance())
        })
    })

    app.all("/estimateGas", ((req, res) => {
        let body = req.body
        let index = 0
        let args = []
        while (body["args[" + index + "]"]) {
            args.push(body["args[" + index + "]"])
            index++
        }

        res.send({
            gas: vnt.estimateGas(req.body.methodName, args)
        })
    }))
    app.listen(port, () => {
        console.log("服务器开始监听端口: " + port)
    })

}

main()
