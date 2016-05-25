///<reference path="TestUtil.ts"/>
///<reference path="../TextProcessor.ts" />

namespace TestTextProcessorNamespace {

    import KeywordProcessor = IndexNamespace.KeywordProcessor;
    import normalizeComponents = TestUtilNamespace.normalizeComponents;
    import createDummyComponents = TestUtilNamespace.createDummyComponents;
    import arrayShouldBeIdentical = TestUtilNamespace.arrayShouldBeIdentical;
    
    export function runTextProcessorTest(){
        let components = normalizeComponents(createDummyComponents());
        var tpc = new KeywordProcessor(components);
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
        
        let expectedResults = ["WSNote", "amazing", "Data", "Data structure", "structure Data", "structure", "structure 101", "101 structure",
            "101", "一些中文乱入", "types", "lists", "singly", "singly linked", "linked singly", "linked", "linked list",
            "list linked", "list", "doubly", "doubly linked", "linked doubly", "linked", "linked list", "list linked",
            "list", "array", "array list", "list array", "list", "wang", "wang sheng", "sheng wang", "sheng", "zeng", "zeng ying", "ying zeng", "ying"];

        arrayShouldBeIdentical(results, expectedResults);
    }

}



