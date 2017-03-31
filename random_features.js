fs = require("fs")
R = require("ramda")

const getRandom = function (min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

const emptyFeatures = R.repeat([[],[],[],[]], 50)

const randomFeatures = R.map(function (feature){
    return R.map(function (pixel) {
        return [getRandom(0,10), getRandom(0,10), getRandom(0,2)]
    })(feature)
})(emptyFeatures)

fs.writeFile("random_features.json", JSON.stringify(randomFeatures), function(err) {
    if(err) {
        return console.log(err)
    }
    console.log("The file was saved!")
})
