let sqlite3 = require("sqlite3").verbose()

console.log("初始化数据库...")
let database = new sqlite3.Database("data.db")
database.run(
    `create table if not exists certification
    (
        id INTEGER
        constraint certification_pk
        primary key autoincrement,
        hash VARCHAR
    );`)

database.run(
    `create table if not exists config
    (
    name VARCHAR
        constraint table_name_pk
            primary key,
    value VARCHAR
    );`)


function addHash(hash) {
    database.run("insert into certification(hash) values('" + hash + "')")
}

function checkHash(hash) {
    return new Promise((resolve, reject) => {
        database.get("select * from certification where hash='" + hash + "'", (error, rs) => {
            if (error) reject(error)
            if (rs) {
                resolve(true)
            } else {
                resolve(false)
            }
        })
    })
}

function getConfig(name) {
    return new Promise((resolve, reject) => {
        database.get("select * from config where name='" + name + "'", (err, rs) => {
            if (err) reject(err)
            if (rs) {
                resolve(rs.value)
            } else {
                resolve(undefined)
            }
        })
    })
}

function setConfig(name, value) {
    database.exec("delete from config where name='" + name + "';" +
        "insert into config(name,value) values('" + name + "','" + value + "')")
}

module.exports = {
    getConfig,
    setConfig,
    addHash,
    checkHash
}
