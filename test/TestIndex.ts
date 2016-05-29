/**
 * Created by wangsheng on 16/5/16.
 */

/// <reference path="../Index.ts" />
/// <reference path="TestUtil.ts" />

namespace TestIndexNamespace {

    import shouldBeUndefined = TestUtilNamespace.shouldBeUndefined;
    import shouldBeEqual = TestUtilNamespace.shouldBeEqual;
    import shouldInclude = TestUtilNamespace.shouldInclude;
    import arrayShouldBeIdentical = TestUtilNamespace.arrayShouldBeIdentical;
    import shouldBeTrue = TestUtilNamespace.shouldBeTrue;
    import shouldBeFalse = TestUtilNamespace.shouldBeFalse;
    import WordType = IndexNamespace.WordType;
    import mapShouldBeIdentical = TestUtilNamespace.mapShouldBeIdentical;
    export function runIndexTest(){

        let index = IndexNamespace.getIndex();

        function testLinkKeyWithNoteIndex(){
            let searchResult = index.get("javascript");
            shouldBeUndefined(searchResult);

            index.putAsSearchKeyword("javascript", false, 1);
            let relatedNotes: Map<number, number> = index.get("JavaScript").relatedNotes;
            shouldBeEqual(relatedNotes.get(1), 1);

            index.putAsSearchKeyword("JavaScript", false, 1);
            relatedNotes = index.get("javascript").relatedNotes;
            shouldBeEqual(relatedNotes.get(1), 2);

            index.putAsSearchKeyword("javascript", false, 2);
            relatedNotes = index.get("javascript").relatedNotes;
            shouldBeEqual(relatedNotes.get(2), 1);

            shouldBeUndefined(relatedNotes.get(5));
            index.putAsSearchKeyword("java", false, 5);
            relatedNotes = index.get("java").relatedNotes;
            shouldBeEqual(relatedNotes.get(5), 1);

            index.putAsSearchKeyword("javascript generated", true, 3);
            index.putAsSearchKeyword("javascript generated", true, 3);

            let keySuggestions = index.keysWithPrefix("javascript");
            shouldInclude(keySuggestions, "javascript", "generated javascript");
        }

        //need to be called after `testLinkKeyWithNoteIndex`
        function testUnlinkKeyFromNoteIndex(){
            index.remove("javaScript", false, 1);
            let relatedNotes: Map<number, number> = index.get("JavaScript").relatedNotes;
            shouldBeEqual(relatedNotes.get(1), 1);

            //`javascript` is not linked to note index 100 and therefore it should take no effect.
            index.remove("javascript", false, 100);
            let unAffectedResults: Map<number, number> = index.get("JavaScript").relatedNotes;
            mapShouldBeIdentical(relatedNotes, unAffectedResults);

            index.remove("javascript", false, 1);
            shouldBeUndefined(index.get("javascript").relatedNotes.get(1));

            index.remove("java", false, 5);
            let searchResult = index.get("java").relatedNotes;
            shouldBeUndefined(searchResult);
        }

        function testIgnorable(){
            shouldBeUndefined(index.isIgnorable("wang sheng"));
            index.putAsNormalStopWord("wang sheng");
            shouldBeTrue(index.isIgnorable("wang sheng"));
            shouldBeEqual(WordType.normalStopWords, index.get("wang sheng").wordType);
        }

        testLinkKeyWithNoteIndex();
        testUnlinkKeyFromNoteIndex();
        testIgnorable();

    }

}
