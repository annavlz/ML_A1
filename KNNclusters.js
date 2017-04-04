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

const calculateDistance = function (xs, ys) {
    return R.pipe(
        R.zip,
        R.map (([x,y]) => Math.sqrt(Math.pow(x - y, 2))),
        R.sum
    )(xs, ys)
}

const sortIntoClusters = function (centres, flower) {
    // console.log(centres)
    let sortedClusters =R.sortBy(R.prop("distance"))([
        {cluster: 0, distance: calculateDistance(R.head(centres[0]).params, flower.params)},
        {cluster: 1, distance: calculateDistance(R.head(centres[1]).params, flower.params)}, 
        {cluster: 2, distance: calculateDistance(R.head(centres[2]).params, flower.params)}
    ])
    return [centres[sortedClusters[1].cluster], centres[sortedClusters[2].cluster], R.append(R.merge(flower, {distance: sortedClusters[0].distance}), centres[sortedClusters[0].cluster])]
}

const start = [[R.merge(trainFile[0], {distance:0})], [R.merge(trainFile[1], {distance:0})], [R.merge(trainFile[2], {distance:0})]]
const data = R.drop(3,trainFile)

const createClusters = function (centres, data, sizes = [0,0,0]) {
    let groupedClusters = R.reduce(sortIntoClusters, centres, data)
    let newCentres = R.map(function(cluster){
        let sortedCLuster = R.sortBy(R.prop("distance"), cluster)
        let size = R.length(cluster)
        return cluster[Math.round(size/2)]
    })(groupedClusters)
    let newSizes = [R.length(groupedClusters[0]), R.length(groupedClusters[1]), R.length(groupedClusters[2])]
    if(R.equals(centres, newCentres) && R.equals(sizes, newSizes)){
        return createClusters (newCentres, data, newSizes)
    } else {
        let classes = R.map((cluster) => getClass(cluster))(groupedClusters)
        // return []newCentres
    }
}

const a = createClusters(start, data)
console.log(a)