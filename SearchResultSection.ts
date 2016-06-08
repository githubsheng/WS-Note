///<reference path="AppEvents.ts"/>
///<reference path="BodySection.ts"/>
///<reference path="CommandsSection.ts"/>
///<reference path="AsyncUtil.ts"/>
///<reference path="Storage.ts"/>
///<reference path="Rank.ts"/>
///<reference path="Digest.ts"/>

namespace SearchResultSectionNamespace {

    import broadcast = AppEventsNamespace.broadcast;
    import AppEvent = AppEventsNamespace.AppEvent;
    import setBody = BodySectionNamespace.setBody;
    import setCommandButtons = CommandsSectionNamespace.setCommandButtons;
    import register = AppEventsNamespace.register;
    import r = Utility.r;
    import getIDB = StorageNamespace.getIDB;
    import iterateNotes = StorageNamespace.iterateNotes;
    import NoteScoreDetail = RankNamespace.NoteScoreDetail;
    import search = RankNamespace.search;
    import digest = DigestNamespace.digest;
    import getNote = StorageNamespace.getNote;

    let newNoteButton = document.createElement("button");
    newNoteButton.appendChild(document.createTextNode("New"));


    function showGetStartedGuide(){
        let getStartedGuideContainer = document.createElement("div");
        getStartedGuideContainer.appendChild(document.createTextNode("Get Started"));
        setBody(getStartedGuideContainer);
    }

    function* createNotePreview(noteScoreDetail: NoteScoreDetail, keyWords: Set<string>): IterableIterator<any> {
        let preview = document.createElement("div");

        let titleDiv = document.createElement("div");
        titleDiv.appendChild(document.createTextNode(noteScoreDetail.noteName));
        preview.appendChild(titleDiv);

        let idb: IDBDatabase = yield getIDB();
        let note: Note = yield getNote(idb, noteScoreDetail.noteId);

        let digestContainer = document.createElement("div");
        let digestFrag = digest(note.components, keyWords);
        digestContainer.appendChild(digestFrag);
        preview.appendChild(digestContainer);

        return preview;
    }

    function showRankedResults(searchKeyWords: Set<string>){
        const numberOfResultsShowedWhenMoreResultsPressed = 20;
        let showedResults = 0;

        let resultLists:HTMLDivElement = document.createElement("div");
        let moreResultsButton = document.createElement("button");
        let moreResultsContainer = document.createElement("div");
        moreResultsContainer.appendChild(moreResultsButton);
        resultLists.appendChild(moreResultsContainer);

        function insertNotePreviews() {
            let rankedResults: NoteScoreDetail[] = search(Array.from(searchKeyWords));
            if(showedResults < rankedResults.length) {
                let searchKeyWords;
                r(function*(){
                    let resultsToShow = rankedResults.slice(showedResults, showedResults += numberOfResultsShowedWhenMoreResultsPressed)
                    for(let i = 0; i < resultsToShow.length; i++) {
                        let notePreview = yield* createNotePreview(resultsToShow[i], searchKeyWords);
                        resultLists.insertBefore(notePreview, moreResultsContainer);
                    }
                });
                if(showedResults >= rankedResults.length) resultLists.removeChild(moreResultsContainer);
            }
        }

        insertNotePreviews();
        moreResultsButton.onclick = insertNotePreviews;

        setBody(resultLists);
    }

    newNoteButton.onclick = function(){
        broadcast(AppEvent.createNewNote);
    };

    register(AppEvent.resultsPage, function(searchKeyWord?: Set<string>){
        setCommandButtons([newNoteButton]);
        if(searchKeyWord === undefined) {
            showGetStartedGuide();
        } else {
            showRankedResults(searchKeyWord);
        }
    });

    //this seemly awkward useless function is called by App.ts to ensure that this search results section module is created first
    export function init(){}
}