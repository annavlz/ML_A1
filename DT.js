fs = require("fs")
R = require("ramda")
Util = require("./util")

var trainFileName, testFileName
[trainFileName, testFileName] = process.argv.slice(2)

const trainFileRaw = Util.parseFile(fs.readFileSync(trainFileName).toString(), "\t")
const testFileRaw = Util.parseFile(fs.readFileSync(testFileName).toString(), "\t")

const keys = R.map(R.toLower)(trainFileRaw[1])

const createCase = function (line) {
    let params = R.fromPairs(R.zip(keys, R.tail(line)))
    return R.merge(params, {label: R.head(line)})
}

const trainFile = R.map(createCase, R.drop(2,trainFileRaw))
const testFile = R.map(createCase, R.drop(2,testFileRaw))

const getClassCount = function (key, data) {
     return R.countBy(R.identity, R.pluck(key, data))
}
const getMajorClass = function (data) {
    return R.pipe(
        R.mapObjIndexed(function (v, i, obj) {
            return {label: i, count: v, probability: (v/R.length(data)*100) + "%"}
        }),
        R.values,
        R.sortWith([R.descend(R.prop("count"))]),
        R.head,
        R.omit("count")
    )(getClassCount("label", data))
}

const BASELINE = getMajorClass(trainFile)

const getClassesRatio = function (set, size) {
    let classesCount = R.values(getClassCount("label", set))
    if(R.length(classesCount) > 1)
        return (classesCount[0]/size) * (classesCount[1]/size) 
    else 
        return 0
}
const getP = function (key, set) {
    let trueSet = R.filter(R.propEq(key, "true"), set)
    let falseSet = R.filter(R.propEq(key, "false"), set)
    let atrSize = R.length(set)
    let trueSetSize = R.length(trueSet)
    let falseSetSize = R.length(falseSet)
    let trueSetClassesRatio = getClassesRatio(trueSet, trueSetSize)
    let falseSetClassesRatio = getClassesRatio(falseSet, falseSetSize)
    return (trueSetSize/atrSize) * trueSetClassesRatio
        + (falseSetSize/atrSize) * falseSetClassesRatio       
}

const attrPs = function (keys, set) {
    return R.reduce(function (arr, key) {
        let keyP = {label: key, p: getP(key, set)}
        return R.append(keyP, arr)
    }, [], keys)
}

getBestAttr = function (attrPs) {
    return R.head(R.sortWith([R.ascend(R.prop("p"))], attrPs)).label
}

const isPure = function (data) {
    // console.log("PURE", R.length(R.values(getClassCount("label", data)))== 1)
    return R.length(R.values(getClassCount("label", data))) == 1
}

const buildTree = function (data, attrs) {
    // console.log (data, attrs)
    if (R.isEmpty(data)){
        // console.log("data EMPTY")
        return BASELINE
    } 
    else if (isPure(data)) {
        // console.log("PURE")
        return {label: data[0].label, probability: "100%"}
    }
    else if (R.isEmpty(attrs)) { 
        // console.log("attr EMPTY")  
        return getMajorClass(data)
    } else {
        // console.log("ELSE")
        let bestAttr = getBestAttr(attrPs(attrs, data))
        let newAttrs = R.reject(R.equals(bestAttr), attrs)
        return { [bestAttr]: { 
            "true": buildTree(R.filter(R.propEq(bestAttr, "true"), data), newAttrs),
            "false": buildTree(R.filter(R.propEq(bestAttr, "false"), data), newAttrs)
        }}
    }
}

const tree = buildTree( trainFile, keys)

const printTabs = function (n) {
    return "\n" + R.join("", R.repeat("  ", n))
}  

const print = function (nT, tree) {
  if(R.has("label", tree)){
      return printTabs(nT) + tree.label + ", " + tree.probability
  } else {
    let attr = R.keys(tree)[0]    
    return printTabs(nT) + attr 
      + printTabs(nT + 1) + "false:" + print(nT + 2, tree[attr].false)
      + printTabs(nT + 1) + "true:" + print(nT + 2, tree[attr].true)
  }
}

console.log(print(0, tree))
