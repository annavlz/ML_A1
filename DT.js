fs = require("fs")
R = require("ramda")
Util = require("./util")
var trainFileName, testFileName
[trainFileName, testFileName] = process.argv.slice(2)

const trainFileRaw = Util.parseFile(fs.readFileSync(trainFileName).toString(), "\t")
const testFileRaw = Util.parseFile(fs.readFileSync(testFileName).toString(), "\t")

const keys = R.prepend("label", R.map(R.toLower)(trainFileRaw[1]))

const createCase = R.pipe(R.zip(keys), R.fromPairs)

const trainCases = R.pipe(R.map(createCase), R.reject(R.isEmpty))(R.drop(2,trainFileRaw))
const testCases = R.pipe(R.map(createCase), R.reject(R.isEmpty))(R.drop(2,testFileRaw))

console.log(testCases)