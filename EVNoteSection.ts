///<reference path="CodeEditor.ts"/>
///<reference path="AppEvents.ts"/>
///<reference path="CommandsSection.ts"/>
///<reference path="BodySection.ts"/>
///<reference path="TextProcessor.ts"/>
///<reference path="ReferenceCache.ts"/>
///<reference path="TagsCache.ts"/>
///<reference path="NoteNameCache.ts"/>
///<reference path="PreviewWindow.ts"/>

namespace EVNoteSectionNamespace {
    
    import createCodeEditor = CodeEditorNamespace.createCodeEditor;
    import register = AppEventsNamespace.register;
    import AppEvent = AppEventsNamespace.AppEvent;
    import setCommandButtons = CommandsSectionNamespace.setCommandButtons;
    import setBody = BodySectionNamespace.setBody;
    import findTags = ContentTransformerNamespace.findTags;
    import findReferences = ContentTransformerNamespace.findReferences;
    import getIDB = StorageNamespace.getIDB;
    import KeywordProcessor = IndexNamespace.KeywordProcessor;
    import getIndex = IndexNamespace.getIndex;
    import removeReference = ReferenceCacheNamespace.removeReference;
    import setTagsForNote = TagsCacheNamespace.setTagsForNote;
    import addReference = ReferenceCacheNamespace.addReference;
    import r = Utility.r;
    import convertToStyledDocumentFragment = ContentTransformerNamespace.convertToStyledDocumentFragment;
    import getNote = StorageNamespace.getNote;
    import broadcast = AppEventsNamespace.broadcast;
    import setNoteName = NoteNameCacheNamespace.setNoteName;
    import closePreviewWindow = PreviewWindowNamespace.closePreviewWindow;
    import getPreviewWindow = PreviewWindowNamespace.getPreviewWindow;
    import getNoteName = NoteNameCacheNamespace.getNoteName;
    import getIdOfNotesThatReferences = ReferenceCacheNamespace.getIdOfNotesThatReferences;

    let index = getIndex();

    let note: Note;

    let codeEditor = createCodeEditor();

    let noteViewerEle = document.createElement("div");
    noteViewerEle.classList.add("noteViewer");

    let viewButton = document.createElement("button");
    viewButton.appendChild(document.createTextNode("View"));
    let deleteButton = document.createElement("button");
    deleteButton.appendChild(document.createTextNode("Delete"));
    let editButton = document.createElement("button");
    editButton.appendChild(document.createTextNode("Edit"));
    let editNoteCommandButtons = [viewButton, deleteButton];
    let viewNoteCommandButtons = [editButton, deleteButton];

    let idOfAutoSaveInterval: number;

    function createNewNote(){
        setCommandButtons(editNoteCommandButtons);
        note = new Note(Date.now(), Date.now());
        codeEditor.setTitle(note.title);
        codeEditor.setValue([]);
        setBody(codeEditor.containerEle);
        startAutoSaveInterval();
    }
    
    function* editNote(){
        setCommandButtons(editNoteCommandButtons);
        codeEditor.setTitle(note.title);
        codeEditor.setValue(note.components);
        setBody(codeEditor.containerEle);
        startAutoSaveInterval();
    }

    function* viewNote() {
        setCommandButtons(viewNoteCommandButtons);
        while(noteViewerEle.firstChild)
            noteViewerEle.removeChild(noteViewerEle.firstChild);

        let titleEle = document.createElement("h2");
        titleEle.appendChild(document.createTextNode(note.title));
        titleEle.classList.add("title");

        let domFrag = yield* convertToStyledDocumentFragment(note.components);

        //references
        let referencesDiv = document.createElement("div");
        let referencesDivTitle = document.createElement("h3");
        referencesDivTitle.innerText = "This note references"
        referencesDiv.appendChild(referencesDivTitle);
        for(let reference of note.references) {
            referencesDiv.appendChild(createNoteLink(reference));
        }
        //referenced by
        let referencedBysDiv = document.createElement("div");
        let referencedByTitle = document.createElement("h3");
        referencedByTitle.innerText = "This note is referenced by";
        referencedBysDiv.appendChild(referencedByTitle);
        for(let referencedBy of getIdOfNotesThatReferences(note.id)) {
            referencedBysDiv.appendChild(createNoteLink(referencedBy));
        }
        //todo: related notes based on search by tags

        noteViewerEle.appendChild(titleEle);
        noteViewerEle.appendChild(domFrag);

        noteViewerEle.appendChild(referencesDiv);
        noteViewerEle.appendChild(referencedBysDiv);

        setBody(noteViewerEle);
    }

    function createNoteLink(noteId: number) {
        return document.createTextNode(getNoteName(noteId));
    }

    function removeNoteContentFromIndexAndCache(){
        //if not a new note, first remove all search key words from pre-modified content
        let titleWords = note.title.split(" ");
        titleWords.forEach(function(e) {
            index.remove(e, false, note.id);
        });
        let tpc = new KeywordProcessor(note.components);
        let kws = tpc.getKeyWords();
        for(let i = 0; i < kws.length; i++) {
            index.remove(kws[i][0], kws[i][1], note.id);
        }
        //if not a new note, remove related tags in tag cache
        setTagsForNote(note.id, []);

        //if not a new note, remove related references in reference cache
        note.references.forEach(function(referenceId: number){
            removeReference(referenceId, note.id);
        });
    }

    function* storeNote(): IterableIterator<any> {
        if(note.id) removeNoteContentFromIndexAndCache();
        //convert the new content to component list and set the components in note
        let components:Component[] = codeEditor.getValue();
        note.components = components;
        note.title = codeEditor.getTitle();
        //if user does not specify a note title, use the first 50 characters in the note content as the title.
        if(note.title === undefined || note.title.trim() === "") {
            for(let component of note.components) {
                if(component.nodeName === "#text" && component.value.trim() !== "") {
                    let cv = component.value.trim();
                    note.title = cv.substring(0, 50);
                    if(note.title.length < cv.length) note.title += "...";
                    break;
                }
            }
        }
        //find and set new tags in note
        note.tags = findTags(components);
        //find and set mew references in note.
        note.references = findReferences(components);
        //store the note in db
        let idb: IDBDatabase = yield getIDB();
        yield StorageNamespace.storeNote(idb, note);
        //add search key words from new content to index
        let titleWords = note.title.split(" ");
        titleWords.forEach(function(e) {
            index.putAsSearchKeyword(e, false, note.id);
        });
        let tpc = new KeywordProcessor(components);
        let kws = tpc.getKeyWords();
        for(let i = 0; i < kws.length; i++) {
            index.putAsSearchKeyword(kws[i][0], kws[i][1], note.id);
        }
        //update note name in note name cache
        setNoteName(note.id, note.title);
        //add new tags to the tag cache
        setTagsForNote(note.id, note.tags);
        //add new reference relationship to reference cache
        note.references.forEach(function(referenceId: number){
            addReference(referenceId, note.id);
        });
    }

    function* deleteNote(): IterableIterator<any> {
        //remove it from db
        let idb: IDBDatabase = yield getIDB();
        yield StorageNamespace.deleteNote(idb, note.id);
        removeNoteContentFromIndexAndCache();
        note = undefined;
    }

    let isContentChanged = false;
    codeEditor.setValueChangeListener(function(){
        isContentChanged = true;
    });

    function startAutoSaveInterval(){
        idOfAutoSaveInterval = window.setInterval(function(){
            if(isContentChanged) {
                r(function*(){
                    isContentChanged = false;
                    yield* storeNote();
                });
            }
        }, 500);
    }

    register(AppEvent.resultsPage, () => {
        closePreviewWindow();
        window.clearInterval(idOfAutoSaveInterval)
    });

    register(AppEvent.createNewNote, createNewNote);

    register(AppEvent.viewNote, function(noteId: number){
        r(function*(){
            let idb: IDBDatabase = yield getIDB();
            note = yield StorageNamespace.getNote(idb, noteId);
            yield* viewNote();
        });
    });

    editButton.onclick = function(){
        r(editNote);
    };

    viewButton.oncontextmenu = function(evt){
        evt.preventDefault();
        getPreviewWindow().then(function(previewWindow: Window){
            previewWindow.postMessage(note.components, "*");
        });
        return false;
    };

    viewButton.onclick = function(){
        closePreviewWindow();
        setCommandButtons(viewNoteCommandButtons);
        r(function*(){
            yield* storeNote();
            yield* viewNote()
        });
    };

    //todo: implement delete button
    deleteButton.onclick = function(){
        r(deleteNote);
        broadcast(AppEvent.resultsPage);
    };

    //this seemly awkward useless function is called by App.ts to ensure that this search results section module is created first
    export function init(){}

}
