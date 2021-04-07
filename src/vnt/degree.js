let vnt = require("./vnt")

function getTotalCertification() {
    return vnt.call("getCertificationTotal", [])
}

function getCertification(hash) {
    return {
        getSchool() {
            return vnt.call("getCertificationSchool", [hash])
        }
    }
}

function getCertificationHash(start, end) {
    return vnt.call("getCertificationHash", [start, end]).split(",")
}

module.exports = {
    getTotalCertification,
    getCertification,
    getCertificationHash
}
