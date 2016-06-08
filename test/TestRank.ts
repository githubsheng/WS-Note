///<reference path="../Rank.ts"/>
///<reference path="TestUtil.ts"/>

namespace TestRankNamespace {

    import getIndex = IndexNamespace.getIndex;
    import setTagsForNote = TagsCacheNamespace.setTagsForNote;
    import addReference = ReferenceCacheNamespace.addReference;
    import addRecentlyViewed = RecentlyViewedCacheNamespace.addRecentlyViewed;
    import search = RankNamespace.search;
    import NoteScoreDetail = RankNamespace.NoteScoreDetail;
    import addNoteName = NoteNameCacheNamespace.addNoteName;
    import shouldBeEqual = TestUtilNamespace.shouldBeEqual;
    import arrayShouldBeIdentical = TestUtilNamespace.arrayShouldBeIdentical;
    import shouldBeTrue = TestUtilNamespace.shouldBeTrue;
    import shouldBeFalse = TestUtilNamespace.shouldBeFalse;

    export function runRankTest(){

        let index = getIndex();

        //for note 1
        index.putAsSearchKeyword("rank one", false, 1);
        index.putAsSearchKeyword("rank one", false, 1);
        index.putAsSearchKeyword("rank one", false, 1);

        index.putAsSearchKeyword("rank two", false, 1);

        index.putAsSearchKeyword("rank three", false, 1);

        setTagsForNote(1, ["rank one", "rank two"]);
        addReference(1, 2); //note 1 is referenced by note 2
        addRecentlyViewed(1);
        addNoteName(1, "note one");

        //for note two
        index.putAsSearchKeyword("rank one", false, 2);
        index.putAsSearchKeyword("rank one", false, 2);
        index.putAsSearchKeyword("rank one", false, 2);

        index.putAsSearchKeyword("rank two", false, 2);

        setTagsForNote(2, ["rank one"]);
        addNoteName(2, "note two");


        //for note three
        index.putAsSearchKeyword("rank three", false, 3);
        addReference(3, 2); //note 3 is referenced by note 2
        addNoteName(3, "note three");


        //for note four
        index.putAsSearchKeyword("rank four", false, 4);
        index.putAsSearchKeyword("rank four", false, 4);
        index.putAsSearchKeyword("rank four", false, 4);
        index.putAsSearchKeyword("rank four", false, 4);

        setTagsForNote(4, ["rank four"]);
        addReference(4, 2); //note 1 is referenced by note 2
        addRecentlyViewed(4);
        addNoteName(4, "note four");

        let noteRankDetails: NoteScoreDetail[] = search(["rank one", "rank two", "rank three"]);

        arrayShouldBeIdentical(noteRankDetails.map((rd)=>rd.noteId), [1, 2, 3]);
        arrayShouldBeIdentical(noteRankDetails.map((rd)=>rd.totalScore), [65, 25, 10]);

        let rankDetailForNoteOne = noteRankDetails[0];
        let tagsInRankDetailsForNoteOne = rankDetailForNoteOne.relevantTags;
        shouldBeTrue(tagsInRankDetailsForNoteOne.has("rank one"));
        shouldBeTrue(tagsInRankDetailsForNoteOne.has("rank two"));

        shouldBeTrue(rankDetailForNoteOne.isAllKeyWordFound);
        shouldBeTrue(rankDetailForNoteOne.referencedByNotesWithName.has("note two"));
        shouldBeTrue(rankDetailForNoteOne.recentlyViewed);

        let rankDetailForNoteTwo = noteRankDetails[1];
        shouldBeFalse(rankDetailForNoteTwo.isAllKeyWordFound);
        shouldBeFalse(rankDetailForNoteTwo.recentlyViewed);
        shouldBeTrue(rankDetailForNoteTwo.relevantTags.has("rank one"));
    }

}