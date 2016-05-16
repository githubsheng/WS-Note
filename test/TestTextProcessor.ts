/**
 * Created by wangsheng on 16/5/16.
 */

/// <reference path="../TextProcessor.ts" />

(function runTextProcessorTest(){
    console.log("starting to run text processor test now...");

    let wordsToProcess = " Data structure 101: there are 一些中文乱入 many types of lists, singly linked list, doubly " +
        "linked list, and array list. ,";
    var tpc = new KeywordProcessor(wordsToProcess);
    let results = [];
    while(tpc.hasNext()) {
        let c = tpc.nextWordCombination();
        if(c.prevComb !== undefined)
            results.push(c.prevComb);
        if(c.cur !== undefined)
            results.push(c.cur);
        if(c.nextComb !== undefined)
            results.push(c.nextComb);
    }

    let expectedResults = ["Data", "Data structure", "structure Data", "structure", "structure 101", "101 structure",
        "101", "一些中文乱入", "types", "lists", "singly", "singly linked", "linked singly", "linked", "linked list",
        "list linked", "list", "doubly", "doubly linked", "linked doubly", "linked", "linked list", "list linked",
        "list", "array", "array list", "list array", "list"];

    if(results.length === expectedResults.length) {
        for(let i = 0; i < results.length; i++) {
            if(results[i] !== expectedResults[i])
                throw new Error("wrong results");
        }
    } else {
        throw new Error("wrong results");
    }

    console.log("text processor test ends...");
})();
