/**
 * Created by wangsheng on 16/5/16.
 */

/// <reference path="../Index.ts" />
/// <reference path="TestUtil.ts" />

namespace TestIndexNamespace {

    export function runIndexTest(){

        let index = IndexNamespace.getIndex();

        function testLinkKeyWithNoteIndex(){
            let searchResult = index.get("javascript");
            shouldBeUndefined(searchResult);

            index.put("javascript", false, 1);
            let relatedNotes = index.get("JavaScript");
            shouldBeEqual(relatedNotes[1], 1);

            index.put("JavaScript", false, 1);
            relatedNotes = index.get("javascript");
            shouldBeEqual(relatedNotes[1], 2);

            index.put("javascript", false, 2);
            relatedNotes = index.get("javascript");
            shouldBeEqual(relatedNotes[2], 1);

            shouldBeUndefined(relatedNotes[5]);
            index.put("java", false, 5);
            relatedNotes = index.get("java");
            shouldBeEqual(relatedNotes[5], 1);

            index.put("javascript generated", true, 3);
            index.put("javascript generated", true, 3);

            let keySuggestions = index.keysWithPrefix("javascript");
            shouldInclude(keySuggestions, "javascript", "generated javascript");
        }

        //need to be called after `testLinkKeyWithNoteIndex`
        function testUnlinkKeyFromNoteIndex(){
            index.remove("javaScript", false, 1);
            let relatedNotes = index.get("JavaScript");
            shouldBeEqual(relatedNotes[1], 1);

            //`javascript` is not linked to note index 100 and therefore it should take no effect.
            index.remove("javascript", false, 100);
            let unAffectedResults = index.get("JavaScript");
            arrayShouldBeIdentical(<number[]>relatedNotes, <number[]>unAffectedResults);

            index.remove("javascript", false, 1);
            shouldBeUndefined(index.get("javascript")[1]);

            index.remove("java", false, 5);
            let searchResult = index.get("java");
            shouldBeUndefined(searchResult);
        }

        function testStopWord(){
            shouldBeUndefined(index.isStopWord("wang sheng"));
            index.putAsStopWords("wang sheng");
            shouldBeTrue(index.isStopWord("wang sheng"));
            shouldBeFalse(index.get("wang sheng"));
        }

        testLinkKeyWithNoteIndex();
        testUnlinkKeyFromNoteIndex();
        testStopWord();

    }

}
