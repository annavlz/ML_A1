fs = require("fs")
R = require("ramda")
Util = require("./util")
var trainFileName, testFileName, K
[trainFileName, testFileName, K] = process.argv.slice(2)

const createFlower = function (line) {
    let label = R.last(line)
    let params = R.map((p) => parseFloat(p))(R.dropLast(1, line))
    return {label: label, params: params}
}

const calculateDistance = function (xs, ys) {
    return R.pipe(
        R.zip,
        R.map (([x,y]) => Math.sqrt(Math.pow(x - y, 2))),
        R.sum
    )(xs, ys)
}

const sortIntoClusters = function (centres, flower) {
    let sortedClusters = R.sortBy(R.prop("distance"))([
        {cluster: 0, distance: calculateDistance(R.head(centres[0]).params, flower.params)},
        {cluster: 1, distance: calculateDistance(R.head(centres[1]).params, flower.params)}, 
        {cluster: 2, distance: calculateDistance(R.head(centres[2]).params, flower.params)}
    ])
    return [centres[sortedClusters[1].cluster], centres[sortedClusters[2].cluster], R.append(R.merge(flower, {distance: sortedClusters[0].distance}), centres[sortedClusters[0].cluster])]
}

const getClass = function (cluster) {
    return  R.last(R.keys(R.invert(Util.getVotes("label")(cluster))))
}


const createClusters = function (centres, data, sizes = [0,0,0], n = 0) {
    let groupedClusters = R.reduce(sortIntoClusters, centres, data)
    let newCentres = R.map(function(cluster){
        let sortedCluster = R.sortBy(R.prop("distance"), cluster)
        let size = R.length(cluster)
        return [R.merge(sortedCluster[Math.round(size/2)], {distance: 0})]
    })(groupedClusters)
    let newSizes = [R.length(groupedClusters[0]), R.length(groupedClusters[1]), R.length(groupedClusters[2])]
    if((R.equals(R.pluck("label",centres),R.pluck("label", newCentres)) && R.equals(sizes, newSizes)) || n > 5000){
        console.log("Finished with", n, "iterations")
        let labels =  R.map((cluster) => getClass(cluster))(groupedClusters)
        console.log("Cluster 1\n", labels[0], "\nCluster 2\n", labels[1], "\nCluster 3\n", labels[2])
        return [{label:labels[0], params: newCentres[0][0].params},
                {label:labels[1], params: newCentres[1][0].params},
                {label:labels[2], params: newCentres[2][0].params}]
    } else {
        return createClusters (newCentres, data, newSizes, n + 1)       
    }
}


const calculateFlowerDistance = function (testFlower, clusterFlower) {
    let distance = calculateDistance(testFlower.params, clusterFlower.params)
    return { distance: distance, clusterLabel: clusterFlower.label, testLabel: testFlower.label }
}


const trainFileRaw = Util.parseFile(fs.readFileSync(trainFileName).toString(), " ")
const testFileRaw = Util.parseFile(fs.readFileSync(testFileName).toString(), " ")
const trainFile = R.map(createFlower)(trainFileRaw)
const testFile = R.map(createFlower)(testFileRaw)
const start = [[R.merge(trainFile[1], {distance:0})], 
               [R.merge(trainFile[25], {distance:0})], 
               [R.merge(trainFile[71], {distance:0})]]

const learnedClusters = createClusters(start, trainFile)

const testedFlowers = R.sum(R.map(function(testFlower){
    let distances = R.map(function(clusterFlower){
            return calculateFlowerDistance(testFlower, clusterFlower)
        }, learnedClusters)
    let sortedClusters = R.sortBy(R.prop("distance"), distances)
    let closest = R.head(sortedClusters)
    return closest.clusterLabel == closest.testLabel ? 1 : 0
})(testFile))
console.log("Finished testing")
console.log("Accuracy is", Math.round(testedFlowers/R.length(testFile)*100), "%")
