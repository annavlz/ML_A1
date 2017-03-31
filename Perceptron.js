fs = require("fs")
R = require("ramda")
Util = require("./util")
const randomFeatures = require("./random_features.json")

var dataFileName
[dataFileName] = process.argv.slice(2)

const keys = ["name", "label", "size", "data"]

const transformations = {
    label: R.drop(1),
    size: R.pipe(R.split(" "), R.map((n) => parseInt(n))),
    data: R.pipe(R.split(""), R.map((n) => parseInt(n)), R.splitEvery(10)),
}

const getValues = function (image, features) {
    return R.map(function (feature) {
        let sum = R.sum(R.map(function (pixel){
            let imagePixel = image.data[pixel[0]][pixel[1]]
            return imagePixel == pixel[2] ? 1 : 0
        })(feature))
        return sum >= 3 ? 1 : 0
    })(features)
}

const valueImage = function (image) {
    let values = R.prepend(1, getValues(image, randomFeatures))
    return R.merge(image, {features: values})
}

const data = R.pipe(
    R.split("\n"),
    R.splitEvery(4),
    R.map((l) => R.evolve(transformations, R.fromPairs(R.zip(keys, l))))  
    
)(fs.readFileSync(dataFileName).toString())

const valuedFeatures = R.map(valueImage, data)

var weights = R.repeat(0, 51)

const predict = function (image, eval = false) {
    let positive = R.sum(R.zipWith(R.multiply, weights, image.features)) > 0
    if (image.label == "Yes") {
        if(!positive){
            if (!eval)
                weights = R.zipWith(R.add, image.features, weights)
            return 0
        }else{
            return 1
        }
    } else {
        if(positive){
            if (!eval)
                weights = R.zipWith(R.subtract, image.features, weights)
            return 0
        }else{
            return 1
        }
    }

}   

const predictionsRound = R.map(function(image){
    return predict(image)
})

const updateRates = function (newRate, rates) {
    let newRates = R.append(newRate, rates)
    if (R.length(rates) > 10) {
        return R.drop(1, newRates)
    }else {
        return newRates
    } 
}

const runPredictions = function (rates, n) {
    let predictions = predictionsRound(valuedFeatures)
    let newRate = R.sum(predictions)/R.length(valuedFeatures)
    if (newRate == 0 || R.all(R.equals(newRate))(rates)) {
        console.log("Finished training with", n, "iterations")
    } else {
        runPredictions(updateRates(newRate, rates), n + 1)
    }
}

const evaluate = function(){
    let predictions = predictionsRound(valuedFeatures, true)
    let rate = R.sum(predictions)/R.length(valuedFeatures)
    console.log("Error rate:", Math.round((1 - rate) * 100), "%\n", "weights:", R.join(",", weights))
}

runPredictions([100], 0)
evaluate()