///<reference path="Index.ts"/>
///<reference path="TagsCache.ts"/>
///<reference path="ReferenceCache.ts"/>
///<reference path="RecentlyViewedCache.ts"/>
///<reference path="NoteNameCache.ts"/>

namespace RankNamespace {

    import getIndex = IndexNamespace.getIndex;
    import getTagsOfNote = TagsCacheNamespace.getTagsOfNote;
    import getIdOfNotesThatReferences = ReferenceCacheNamespace.getIdOfNotesThatReferences;
    import isRecentlyViewed = RecentlyViewedCacheNamespace.isRecentlyViewed;
    import getNoteName = NoteNameCacheNamespace.getNoteName;
    const searchKeyWordAppearanceTotalScore = 45;
    const totalScoreForAllKeyWordsFound = 15;
    const keyWordMatchTagTotalScore = 15;
    const totalScoreForReferencedBy = 15;
    const scorePerReferenceBy = 5;
    let index = getIndex();

    export interface NoteScoreDetail {
        noteId: number;
        noteName: string;
        keyWordAppearance: Map<string, number>;
        isAllKeyWordFound: boolean;
        relevantTags: Set<string>;
        referencedByNotesWithName: Set<string>;
        recentlyViewed: boolean;
        totalScore: number;
    }

    /*
     * provided by an array of search key words, it should provide a list of note id, the list needs to be sorted by
     * relevance.
     */
    export function search (searchKeyWords: string[]): {results: NoteScoreDetail[], searchTime: number} {

        if(searchKeyWords.length === 0) {
            return {
                results: [],
                searchTime: 0
            };
        }

        //try break down word combos into individual words and give those words a try as well
        //in this case, if searchKeyWords is ["wang sheng", "storage"], the output will be ["wang sheng", "wang", "sheng", "storage"]
        //I need the word combo "wang sheng" kept despite its component "wang" and "sheng" is added, so that notes that actually and really
        //contain that word combo can receive higher ranking.

        let searchStartTime = Date.now();

        let temp: string[] = [];
        for(let kw of searchKeyWords) {
            temp.push(kw);
            let s = kw.split(" ");
            if(s.length > 1) temp.push(s[0], s[1]);
        }
        searchKeyWords = temp;

        let numberOfSearchKeyWords = searchKeyWords.length;
        let singleKeyWordAppearanceTotalScore = searchKeyWordAppearanceTotalScore / numberOfSearchKeyWords;
        let scorePerKeyWordAppearance = singleKeyWordAppearanceTotalScore / 3;

        let idsOfAllRelatedNotes: Set<number> = new Set();

        for(let keyWord of searchKeyWords) {
            let result = index.get(keyWord);
            if(result && result.wordType === WordType.word) {
                let notesRelatedToKeyWord = result.relatedNotes;

                for(let noteId of notesRelatedToKeyWord.keys()) {
                    idsOfAllRelatedNotes.add(noteId);
                }
            }
        }

        let searchEndTime = Date.now();

        let noteRankScoreDetails: NoteScoreDetail[] = [];

        for(let noteId of idsOfAllRelatedNotes) {

            let noteScoreDetail: NoteScoreDetail = {
                noteId: noteId,
                noteName: getNoteName(noteId),
                keyWordAppearance: new Map(),
                isAllKeyWordFound: false,
                relevantTags: new Set(),
                referencedByNotesWithName: new Set(),
                recentlyViewed: false,
                totalScore: 0
            };

            //now calculate the score of each note.
            let searchKeyWordAppearanceScore = 0;
            let numberOfKeyWordsFound = 0;

            for(let keyWord of searchKeyWords) {
                let result = index.get(keyWord);
                if(result.wordType === WordType.word) {
                    let notesRelatedToKeyWord = result.relatedNotes;
                    let numberOfAppearanceOfKeyWordInNote = notesRelatedToKeyWord.get(noteId);
                    if(numberOfAppearanceOfKeyWordInNote !== undefined) {
                        numberOfKeyWordsFound++;
                        searchKeyWordAppearanceScore += Math.min(numberOfAppearanceOfKeyWordInNote * scorePerKeyWordAppearance, singleKeyWordAppearanceTotalScore);
                        noteScoreDetail.keyWordAppearance.set(keyWord, numberOfAppearanceOfKeyWordInNote);
                    }
                }
            }

            let bonusScoreForAllKeyWordsFound = 0;
            if(numberOfKeyWordsFound === numberOfSearchKeyWords) {
                bonusScoreForAllKeyWordsFound = totalScoreForAllKeyWordsFound;
                noteScoreDetail.isAllKeyWordFound = true;
            }

            let keyWordMatchTagScore = 0;
            let scorePerKeyWordTagMatch = keyWordMatchTagTotalScore / numberOfSearchKeyWords;

            let tagsOfNote = getTagsOfNote(noteId);
            for(let keyWord of searchKeyWords) {
                if(tagsOfNote.indexOf(keyWord) > - 1) {
                    keyWordMatchTagScore += scorePerKeyWordTagMatch;
                    noteScoreDetail.relevantTags.add(keyWord);
                }
            }

            let scoreForReferencedBy = 0;
            let referencedByNotesWithId = getIdOfNotesThatReferences(noteId);
            scoreForReferencedBy = Math.min(referencedByNotesWithId.size * scorePerReferenceBy, totalScoreForReferencedBy);
            for(let id of referencedByNotesWithId) {
                let noteName = getNoteName(id);
                noteScoreDetail.referencedByNotesWithName.add(noteName)
            }

            let recentlyViewed = isRecentlyViewed(noteId);
            let recentlyViewedScore = recentlyViewed ? 10 : 0;
            noteScoreDetail.recentlyViewed = recentlyViewed;

            noteScoreDetail.totalScore = searchKeyWordAppearanceScore + bonusScoreForAllKeyWordsFound + keyWordMatchTagScore
                + scoreForReferencedBy + recentlyViewedScore;

            noteRankScoreDetails.push(noteScoreDetail);
        }

        noteRankScoreDetails.sort(function(a:NoteScoreDetail, b:NoteScoreDetail) {
           return b.totalScore - a.totalScore;
        });

        return {
            results: noteRankScoreDetails,
            searchTime: searchEndTime - searchStartTime
        };
    }


}