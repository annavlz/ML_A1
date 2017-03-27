fs = require("fs")
R = require("ramda")
Util = require("./util")

var trainFileName, testFileName
[trainFileName, testFileName] = process.argv.slice(2)

const trainFileRaw = Util.parseFile(fs.readFileSync(trainFileName).toString(), "\t")
const testFileRaw = Util.parseFile(fs.readFileSync(testFileName).toString(), "\t")


const createCase = function (line) {
    let params = R.fromPairs(R.zip(keys, R.tail(line)))
    return R.merge(params, {label: R.head(line)})
}


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

const enthropy = function (x,y){
    return ((x/y) * Math.log2(x/y)) * -1 
}

const getClassesRatio = function (set, size) {
    let classesCount = R.values(getClassCount("label", set))
    if(R.length(classesCount) > 1)
        return (classesCount[0]/size) * (classesCount[1]/size) 
    else 
        return 0
}

const getClassesEnthropy = function (set, size) {
    let classesCount = R.values(getClassCount("label", set))
    if(R.length(classesCount) > 1)
        return enthropy(classesCount[0]/size) + enthropy(classesCount[1]/size) 
    else 
        return 0
}


const getP = function (key, set) {
    let trueSet = R.filter(R.propEq(key, "true"), set)
    let falseSet = R.filter(R.propEq(key, "false"), set)
    let setSize = R.length(set)
    let trueSetSize = R.length(trueSet)
    let falseSetSize = R.length(falseSet)
    let trueSetClassesRatio = getClassesRatio(trueSet, trueSetSize)
    let falseSetClassesRatio = getClassesRatio(falseSet, falseSetSize)
    return (trueSetSize/setSize) * trueSetClassesRatio
        + (falseSetSize/setSize) * falseSetClassesRatio
}

// with information gain approach
// const getP = function (key, set) {
//     let trueSet = R.filter(R.propEq(key, "true"), set)
//     let falseSet = R.filter(R.propEq(key, "false"), set)
//     let setSize = R.length(set)
//     let trueSetSize = R.length(trueSet)
//     let falseSetSize = R.length(falseSet)
//     let setEnthropy = getClassesEnthropy(set, setSize)
//     let trueSetEnthropy = getClassesEnthropy(trueSet, trueSetSize)
//     let falseSetEnthropy = getClassesEnthropy(falseSet, falseSetSize)
//     return setEnthropy - ((trueSetSize/setSize) * trueSetEnthropy) - ((falseSetSize/setSize) * falseSetEnthropy)
// }


const attrPs = function (keys, set) {
    let p = R.reduce(function (arr, key) {
        let keyP = {label: key, p: getP(key, set)}
        return R.append(keyP, arr)
    }, [], keys)
    // console.log(p)
    return p
}


const getBestAttr = function (attrPs) {
    // console.log(R.sortWith([R.ascend(R.prop("p"))], attrPs))
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
        // console.log(bestAttr)
        let newAttrs = R.reject(R.equals(bestAttr), attrs)
        return { [bestAttr]: { 
            "true": buildTree(R.filter(R.propEq(bestAttr, "true"), data), newAttrs),
            "false": buildTree(R.filter(R.propEq(bestAttr, "false"), data), newAttrs)
        }}
    }
}


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


const getNode = function (tree, line) {
    // console.log(line, tree)
    if(R.has("label", tree)){
        // console.log("return", tree)
        return tree
    } else {
        let attr = R.keys(tree)[0]
        return getNode(tree[attr][line[attr]], line)
    }
}


const evaluate = function (tree, set) {
    let evals = R.map(function (line) {
        let node = getNode(tree, line)
        return node.label == line.label ? 1 : 0
    })(set)
    return R.sum(evals)/R.length(evals)
}


// const evaluateBaseline = function (baseline, set) {
//     let evals = R.map(function (line) {
//         return baseline.label == line.label ? 1 : 0
//     })(set)
//     return R.sum(evals)/R.length(evals)
// }


const keys = R.map(R.toLower)(trainFileRaw[1])
const trainFile = R.map(createCase, R.drop(2,trainFileRaw))
const testFile = R.map(createCase, R.drop(2,testFileRaw))
const BASELINE = getMajorClass(trainFile)
const tree = buildTree( trainFile, keys)

console.log(BASELINE)
// console.log(print(0, tree))
// fs.writeFile("print", print(0, tree), function(err) {
//     if(err) {
//         return console.log(err);
//     }
//     console.log("The file was saved!");
// }); 
// console.log(evaluate(tree, testFile))
