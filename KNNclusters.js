fs = require("fs")
R = require("ramda")
Util = require("./util")
var trainFileName, testFileName, K
[trainFileName, testFileName, K] = process.argv.slice(2)

const trainFileRaw = Util.parseFile(fs.readFileSync(trainFileName).toString(), " ")
const testFileRaw = Util.parseFile(fs.readFileSync(testFileName).toString(), " ")

const createFlower = function (line) {
    let label = R.last(line)
    let params = R.map((p) => parseFloat(p))(R.dropLast(1, line))
    return {label: label, params: params}
}

const trainFile = R.map(createFlower)(trainFileRaw)
const testFile = R.map(createFlower)(testFileRaw)

const sortIntoClusters = function (centres, flower) {
    let c1d = {cluster: 0, distance: R.head(centres[0])}
    let c2d = {cluster: 0, distance: R.head(centres[1])}
    let c3d = {cluster: 0, distance: R.head(centres[2])}
    return 
}

R.reduce(sort, centres, data)