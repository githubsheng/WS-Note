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
        let results = tpc.getKeyWords().map(function(e) {
            return e[0];
        });

        let expectedResults = ["WSNote", "amazing", "singly", "linked", "singly linked", "linked singly", "list", "linked list", "list linked"];

        arrayShouldBeIdentical(results, expectedResults);
    }

}



