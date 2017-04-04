fs = require("fs")
R = require("ramda")


// String -> String -> [[ String ]]
const parseFile = function (rawString, token) {
    let lines = R.pipe(
        R.split("\n"),
        R.map( R.pipe(
            R.split(token),
            R.reject(R.isEmpty)
        ))
    )(rawString)
    return R.reject(R.isEmpty, lines)
}

const parseFileLines = function (rawString) {
    return R.pipe(
        R.split("\n"),
        R.map(R.reject(R.isEmpty))
    )(rawString)
}


// Curried function [Float] -> [Float] -> [Float] -> Float
// Input lists has to be of equal length
// Euclidian distance with ranges adjustment
const calculateDistance = function (xs, ys, rs) {
    return R.pipe(
        R.zip,
        R.zip (rs),
        R.map (R.flatten),  
        R.map (([r,x,y]) => Math.sqrt(Math.pow(x - y, 2) / Math.pow(r, 2))),
        R.sum
    )(xs, ys)
}

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
    parseFileLines: parseFileLines,
    calculateDistance: calculateDistance,
    getVotes: getVotes,
    compareWithLabel: compareWithLabel,
    evaluate: evaluate
}