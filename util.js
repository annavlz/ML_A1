fs = require("fs")
R = require("ramda")

// Curried function String -> [[ String ]]
const parseFile = R.pipe(
    R.split("\n") ,
        R.map( R.pipe(
        R.split(" "),
        R.reject(R.isEmpty)
    ))
)


// Curried function [Float] -> [Float] -> Float
// Input lists has to be of equal length
const calculateDistance = R.pipe(
        R.zip, 
        R.map (([x,y]) => Math.pow(x - y, 2)),
        R.sum
    )


// Integer -> [Object] -> String -> String
const getPrediction = function (K, neighbours, key) {
    const countedVotes = R.pipe(
        R.slice(0, K), 
        R.pluck(key), 
        R.countBy(R.identity), 
        R.invert
    )(neighbours)
    const sortedRatings = R.keys(countedVotes).sort()
    return countedVotes[R.last(sortedRatings)][0]
}

module.exports = {
    parseFile: parseFile,
    calculateDistance: calculateDistance,
    getPrediction: getPrediction
}