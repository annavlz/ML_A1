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
const calculateFlowerDistance = function (testFlower, trainFlower) {
    let distance = Util.calculateDistance(testFlower.params, trainFlower.params)
    return { distance: distance, label: trainFlower.label }
}

const curriedCalculateDistance = R.curry(calculateFlowerDistance)

const sortByDistance = R.sortWith([R.ascend(R.prop("distance"))])

const predictLabel = function (testFlower) {
    let findNeighbours = curriedCalculateDistance(testFlower)
    let sortedNeighbours = sortByDistance(R.map(findNeighbours, trainFile))
    // console.log(testFlower, sortedNeighbours)
    let predictedClass = Util.getPrediction(K, sortedNeighbours, "label")
    return {label: testFlower.label, prediction: predictedClass}
}

const compareWithLabel = function (item) {
    console.log(item)
    return item.label == item.prediction ? 1 : 0
}

const evaluate = function (results) {
    return R.sum(results) / R.length(results)
}

const run = R.pipe(
    R.map(predictLabel)
  , R.map(compareWithLabel)
  , evaluate
)

console.log(run(testFile))
