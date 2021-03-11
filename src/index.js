let express = require("express")
let bodyParser = require('body-parser')
let vnt = require("./vnt")
let app = express()
let port = 3000

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.post("/transfer", async (req, res) => {
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
    } catch (err) {
        res.status(500)
        res.send(err)
    }
})

app.get("/call", async (req, res) => {
    let query = req.query

    try {
        res.send(vnt.call(query.methodName, query.args))
    } catch (err) {
        res.status(500)
        res.send(err)
    }


})

app.get("/watch", async (req, res) => {
    let query = req.query

    vnt.watch(res, query.eventName)
})


app.listen(port, () => {
    console.log("服务器开始监听端口: " + port)
})

