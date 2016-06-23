///<reference path="AppEvents.ts"/>
///<reference path="BodySection.ts"/>
///<reference path="CommandsSection.ts"/>
///<reference path="AsyncUtil.ts"/>
///<reference path="Storage.ts"/>
///<reference path="Rank.ts"/>
///<reference path="Digest.ts"/>
///<reference path="PreviewWindow.ts"/>

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
    import displayPreview = PreviewWindowNamespace.displayPreview;
    import closePreview = PreviewWindowNamespace.closePreview;


    function showGetStartedGuide() {
        let getStartedGuideContainer = document.createElement("div");
        getStartedGuideContainer.classList.add("getStartedContainer");
        let getStartedBtn = document.createElement("button");
        getStartedBtn.innerText = "Get Started";
        getStartedBtn.onclick = function(){
            broadcast(AppEvent.viewManual);
        };
        getStartedGuideContainer.appendChild(getStartedBtn);
        setBody(getStartedGuideContainer);
    }

    function* createNotePreview(noteScoreDetail:NoteScoreDetail):IterableIterator<any> {
        let preview = document.createElement("div");
        preview.classList.add("notePreview");

        let titleDiv = document.createElement("div");
        titleDiv.classList.add("title");
        titleDiv.appendChild(document.createTextNode(noteScoreDetail.noteName));
        preview.appendChild(titleDiv);

        let idb:IDBDatabase = yield getIDB();
        let note:Note = yield getNote(idb, noteScoreDetail.noteId);

        let digestContainer = document.createElement("div");
        //only pass in key words that are expected to be shown in this specific note
        let digestFrag = digest(note.components, new Set<string>(noteScoreDetail.keyWordAppearance.keys()));
        digestContainer.appendChild(digestFrag);
        preview.appendChild(digestContainer);

        let rankingDetail = document.createElement("div");
        rankingDetail.classList.add("rankingDetail");
        let keyWordAppearanceString = "";
        for(let keyWordAppearance of noteScoreDetail.keyWordAppearance.entries()){
            keyWordAppearanceString += keyWordAppearance[0] + " x" + keyWordAppearance[1] + " ";
        }
        let tagsMatchedString = "";
        for(let tagMatched of noteScoreDetail.relevantTags) {
            tagsMatchedString += "#" + tagMatched + "# ";
        }
        let referencedByString = noteScoreDetail.referencedByNotesWithName.size ===  0 ?
            "" : "Referenced by " + noteScoreDetail.referencedByNotesWithName.size + " other note(s) ";
        let recentlyViewed = noteScoreDetail.recentlyViewed ? "Recently viewed" : "";

        let rankDetailStr = [keyWordAppearanceString, tagsMatchedString, referencedByString, recentlyViewed].filter(function(s){
            return s !== "";
        }).join("| ");
        rankingDetail.appendChild(document.createTextNode(rankDetailStr));

        let totalScoreOutterBar = document.createElement("div");
        totalScoreOutterBar.style.display = "inline-block";
        totalScoreOutterBar.style.border = "1px solid lightgray";
        totalScoreOutterBar.style.width = "100px";
        totalScoreOutterBar.style.height = "10px";
        let totalScoreInnerBar = document.createElement("div");
        totalScoreInnerBar.style.width = noteScoreDetail.totalScore.toString() + "px";
        totalScoreInnerBar.style.backgroundColor = "lightgray";
        totalScoreInnerBar.style.height = "10px";
        totalScoreOutterBar.appendChild(totalScoreInnerBar);

        rankingDetail.appendChild(totalScoreOutterBar);

        preview.appendChild(rankingDetail);

        preview.oncontextmenu = function(evt){
            evt.preventDefault();
            displayPreview(note);
            return false;
        };

        preview.onclick = function(evt: MouseEvent){
            broadcast(AppEvent.viewNote, note.id);
        };

        return preview;
    }

    function showRankedResults(searchKeyWords:Set<string>) {
        const numberOfResultsShowedWhenMoreResultsPressed = 20;
        let showedResults = 0;

        let resultLists:HTMLDivElement = document.createElement("div");
        resultLists.classList.add("searchResultList");

        let searchReturn = search(Array.from(searchKeyWords));
        let rankedResults:NoteScoreDetail[] = searchReturn.results;
        let searchTime = searchReturn.searchTime;
        let searchSummaryStr = searchReturn.results.length + " results found in " + searchTime + " milliseconds";
        let searchSummary = document.createElement("div");
        searchSummary.appendChild(document.createTextNode(searchSummaryStr));
        searchSummary.classList.add("searchSummary");
        resultLists.appendChild(searchSummary);

        let moreResultsButton = document.createElement("button");
        moreResultsButton.innerText = "Show More";
        let moreResultsContainer = document.createElement("div");
        moreResultsContainer.style.textAlign = "center";
        moreResultsContainer.appendChild(moreResultsButton);
        resultLists.appendChild(moreResultsContainer);

        function insertNotePreviews() {
            r(function*() {
                if (showedResults < rankedResults.length) {
                    let resultsToShow = rankedResults.slice(showedResults, showedResults += numberOfResultsShowedWhenMoreResultsPressed);
                    for (let i = 0; i < resultsToShow.length; i++) {
                        let notePreview = yield* createNotePreview(resultsToShow[i]);
                        resultLists.insertBefore(notePreview, moreResultsContainer);
                    }
                    if (showedResults >= rankedResults.length) resultLists.removeChild(moreResultsContainer);
                }
            });
        }

        insertNotePreviews();
        moreResultsButton.onclick = insertNotePreviews;

        setBody(resultLists);
    }

    register(AppEvent.resultsPage, function (searchKeyWord?:Set<string>) {
        setCommandButtons([]);
        if (searchKeyWord === undefined) {
            showGetStartedGuide();
        } else {
            showRankedResults(searchKeyWord);
        }
    });

//this seemly awkward useless function is called by App.ts to ensure that this search results section module is created first
    export function init() {
    }
}