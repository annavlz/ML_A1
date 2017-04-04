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

const groupParams = (function (sets, flower) {
    return R.map(R.flatten, (R.zip(sets, flower.params)))
})

const trainFile = R.map(createFlower)(trainFileRaw)
const testFile = R.map(createFlower)(testFileRaw)
const ranges = R.map(function (set) {
    let sortedSet = set.sort()
    return R.last(sortedSet) - R.head(sortedSet)
})(R.reduce(groupParams, [[],[],[],[]], trainFile))

const calculateFlowerDistance = function (testFlower, trainFlower) {
    let distance = Util.calculateDistance(testFlower.params, trainFlower.params, ranges)
    return { distance: distance, label: trainFlower.label }
}

const curriedCalculateDistance = R.curry(calculateFlowerDistance)

const sortByDistance = R.sortWith([R.ascend(R.prop("distance"))])

const getLabelPrediction = function(neighbours) {
    let votes = Util.getVotes("label")(R.slice(0, K, neighbours))
    let sortedVotes = R.keys(votes).sort()
    return votes[R.last(sortedVotes)][0]
}

const predictLabel = function (testFlower) {
    let findNeighbours = curriedCalculateDistance(testFlower)
    let sortedNeighbours = sortByDistance(R.map(findNeighbours, trainFile))
    let predictedClass = getLabelPrediction(sortedNeighbours)
    return {label: testFlower.label, prediction: predictedClass}
}

const run = R.pipe(
    R.map(predictLabel)
  , R.map(Util.compareWithLabel)
  , Util.evaluate
)

console.log(run(testFile))
