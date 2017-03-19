fs = require("fs")
R = require("ramda")

// String -> String -> [[ String ]]
const parseFile = function (rawString, token) {
    return R.pipe(
        R.split("\n") ,
            R.map( R.pipe(
            R.split(token),
            R.reject(R.isEmpty)
        ))
    )(rawString)
}

// Curried function [Float] -> [Float] -> Float
// Input lists has to be of equal length
const calculateDistance = R.pipe(
        R.zip, 
        R.map (([x,y]) => Math.pow(x - y, 2)),
        R.sum
    )


// Curries function String -> [Object] -> String
const getVotes = function (key) {
    return R.pipe(
        R.pluck(key), 
        R.countBy(R.identity), 
        R.invert
    )  
}

// {label, prediction} -> Integer
const compareWithLabel = function (item) {
    console.log(item)
    return item.label == item.prediction ? 1 : 0
}

// [Integer] -> Float
const evaluate = function (results) {
    return R.sum(results) / R.length(results)
}

module.exports = {
    parseFile: parseFile,
    calculateDistance: calculateDistance,
    getVotes: getVotes,
    compareWithLabel: compareWithLabel,
    evaluate: evaluate
}