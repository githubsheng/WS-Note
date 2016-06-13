///<reference path="CommonModels.ts"/>
///<reference path="ContentTransformer.ts"/>
///<reference path="ReferenceCache.ts"/>
///<reference path="Rank.ts"/>
namespace ViewNote {

    import convertToStyledDocumentFragment = ContentTransformerNamespace.convertToStyledDocumentFragment;
    import getIdOfNotesThatReferences = ReferenceCacheNamespace.getIdOfNotesThatReferences;
    import tokenizeParagraph = TokenizorNamespace.tokenizeParagraph;
    import search = RankNamespace.search;
    import NoteScoreDetail = RankNamespace.NoteScoreDetail;
    import getNoteName = NoteNameCacheNamespace.getNoteName;
    import broadcast = AppEventsNamespace.broadcast;
    import AppEvent = AppEventsNamespace.AppEvent;

    export function* generateNoteViewerContent(noteViewerEle: HTMLDivElement, note: Note){
        let titleEle = document.createElement("h2");
        titleEle.appendChild(document.createTextNode(note.title));
        titleEle.classList.add("title");

        noteViewerEle.appendChild(titleEle);

        let domFrag = yield* convertToStyledDocumentFragment(note.components);
        noteViewerEle.appendChild(domFrag);

        //references
        if(note.references.length > 0) {
            let referencesDiv = document.createElement("div");
            let referencesDivTitle = document.createElement("h3");
            referencesDivTitle.innerText = "This note references";
            referencesDiv.appendChild(referencesDivTitle);
            for(let reference of note.references) {
                referencesDiv.appendChild(createNoteLink(reference));
                referencesDiv.appendChild(document.createElement("br"));
            }
            noteViewerEle.appendChild(document.createElement("br"));
            noteViewerEle.appendChild(referencesDiv);
        }

        //referenced by
        if(getIdOfNotesThatReferences(note.id).size > 0) {
            let referencedBysDiv = document.createElement("div");
            let referencedByTitle = document.createElement("h3");
            referencedByTitle.innerText = "This note is referenced by";
            referencedBysDiv.appendChild(referencedByTitle);
            for(let referencedBy of getIdOfNotesThatReferences(note.id)) {
                referencedBysDiv.appendChild(createNoteLink(referencedBy));
                referencedBysDiv.appendChild(document.createElement("br"));
            }
            noteViewerEle.appendChild(document.createElement("br"));
            noteViewerEle.appendChild(referencedBysDiv);
        }

        //related notes
        let searchKeyWordsForFindingRelatedNotes = [];
        let titleTokens = tokenizeParagraph(note.title);
        for (let i = 0; i < titleTokens.tokenTypes.length; i++) {
            if(titleTokens.tokenTypes[i] === WordType.word)
                searchKeyWordsForFindingRelatedNotes.push(titleTokens.tokenValues[i]);
        }
        searchKeyWordsForFindingRelatedNotes = searchKeyWordsForFindingRelatedNotes.concat(note.tags);
        let searchResults = search(searchKeyWordsForFindingRelatedNotes);
        let relatedNoteIds = searchResults.results.map(function(r: NoteScoreDetail) {
            return r.noteId;
        }).slice(0, 10);
        //skip the note itself
        let idx = relatedNoteIds.indexOf(note.id);
        if(idx > -1) relatedNoteIds.splice(idx, 1);

        if(relatedNoteIds.length > 0) {
            let relatedDiv = document.createElement("div");
            let relatedDivTitle = document.createElement("h3");
            relatedDivTitle.innerText = "Possible related notes";
            relatedDiv.appendChild(relatedDivTitle);
            for(let related of relatedNoteIds) {
                relatedDiv.appendChild(createNoteLink(related));
                relatedDiv.appendChild(document.createElement("br"));
            }
            noteViewerEle.appendChild(document.createElement("br"));
            noteViewerEle.appendChild(relatedDiv);
        }
    }

    function createNoteLink(noteId: number) {
        let noteName = getNoteName(noteId);
        let button = document.createElement("button");
        button.innerText = noteName;
        button.onclick = function(){
            broadcast(AppEvent.viewNote, noteId);
        };
        return button;
    }
}