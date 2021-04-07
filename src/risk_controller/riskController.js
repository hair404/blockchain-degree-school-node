let data = require("./data")
let degree = require("../vnt/degree")
let email = require("emailjs")

async function init() {
    console.log("连接到邮箱服务器...")
    let smtpClient = new email.SMTPClient({
        user: process.env.EMAIL_ACCOUNT,
        password: process.env.EMAIL_PASSWORD,
        host: process.env.SMTP_SERVER,
        ssl: process.env.SSL === "true"
    })
    console.log("设置风控系统...")
    let hasChecked = await data.getConfig("hasChecked")
    if (!hasChecked) {
        data.setConfig("hasChecked", degree.getTotalCertification())
    }
    setInterval(async (msg, callback) => {
        let lastCheck = Number(await data.getConfig("hasChecked"))
        let certAmount = Number(degree.getTotalCertification())
        if (lastCheck < certAmount) {
            console.log("监测到 " + (certAmount - lastCheck) + " 张新证书，正在核验...")

            let index = lastCheck
            let error_hash = ""
            while (index < certAmount) {

                index += 10
                if (index > certAmount) {
                    index = certAmount
                }

                // console.log(lastCheck + " " + (index - 1))
                let hashList = degree.getCertificationHash(index - 10, index - 1)

                for (let hash of hashList) {
                    let safe = await data.checkHash(hash)
                    if (safe) {
                        console.log(hash + "---正常")
                    } else {
                        error_hash += hash + "\n"
                        console.log(hash + "---异常，通知管理员")
                    }
                }
            }
            if (error_hash !== "") {
                await smtpClient.sendAsync(new email.Message({
                    "from": process.env.EMAIL_ACCOUNT,
                    "to": process.env.NOTICE_EMAIL,
                    "subject": "学历管理系统---密钥泄漏提醒",
                    "text": `
                        尊敬的管理员:
                        \t\t系统监测未经授权的证书: {0}，请及时检查证书来源，若非合法操作，请联系管理机构更换密钥并将当前密钥作废。
                        `.replace("{0}", error_hash)
                }))
            }

            data.setConfig("hasChecked", certAmount)
        }
    }, 10 * 1000)
}

function saveHash(hash) {
    data.addHash(hash)
}


module.exports = {
    init,
    saveHash
}
