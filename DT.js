fs = require("fs")
R = require("ramda")
Util = require("./util")

var trainFileName, testFileName
[trainFileName, testFileName] = process.argv.slice(2)

const trainFileRaw = Util.parseFile(fs.readFileSync(trainFileName).toString(), "\t")
const testFileRaw = Util.parseFile(fs.readFileSync(testFileName).toString(), "\t")

const createCase = function (line) {
    return { label: R.head(line), params: R.tail(line)}
}

const makeTree = function (depth, start) {
    if(start < depth) {
        return {"true": makeTree(depth, start + 1), "false": makeTree(depth, start + 1)}
    } else {
        return {"true": [], "false": []}
    }
}

const trainTree = function (tree, tCase) {
    let lens = R.lensPath(tCase.params)
    return R.over(lens, R.append(tCase.label), tree)
}

const getPrediction = function (labels) {
    

}

const predictedLabel = function (tree, pCase) {
    let leaf = R.path(pCase.params)
    let label = getPrediction(leaf)
    return label
}

const trainCases = R.pipe(R.map(createCase), R.reject(R.isEmpty))(R.drop(2,trainFileRaw))
const testCases = R.pipe(R.map(createCase), R.reject(R.isEmpty))(R.drop(2,testFileRaw))

const emptyTree = makeTree(R.length(keys), 1)
const trainedTree = R.reduce(trainTree, emptyTree, trainCases)



