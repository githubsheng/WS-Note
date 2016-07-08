///<reference path="CodeEditor.ts"/>
///<reference path="AppEvents.ts"/>
///<reference path="CommandsSection.ts"/>
///<reference path="BodySection.ts"/>
///<reference path="TextProcessor.ts"/>
///<reference path="ReferenceCache.ts"/>
///<reference path="TagsCache.ts"/>
///<reference path="NoteNameCache.ts"/>
///<reference path="PreviewWindow.ts"/>
///<reference path="ViewNote.ts"/>

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
    import getNote = StorageNamespace.getNote;
    import broadcast = AppEventsNamespace.broadcast;
    import setNoteName = NoteNameCacheNamespace.setNoteName;
    import getNoteName = NoteNameCacheNamespace.getNoteName;
    import getIdOfNotesThatReferences = ReferenceCacheNamespace.getIdOfNotesThatReferences;
    import NoteScoreDetail = RankNamespace.NoteScoreDetail;
    import displayPreview = PreviewWindowNamespace.displayPreview;
    import closePreview = PreviewWindowNamespace.closePreview;
    import generateNoteViewerContent = ViewNote.generateNoteViewerContent;
    import refreshPreviewIfPreviewIsOpen = PreviewWindowNamespace.refreshPreviewIfPreviewIsOpen;
    import tokenizeParagraph = TokenizorNamespace.tokenizeParagraph;
    import tokenize = TokenizorNamespace.tokenize;
    import setHint = FooterSectionNamespace.setHint;
    import setBackNavigation = FooterSectionNamespace.setBackNavigation;
    import addRecentlyViewed = RecentlyViewedCacheNamespace.addRecentlyViewed;

    let index = getIndex();

    let note: Note;

    let codeEditor = createCodeEditor();

    let noteViewerEle = document.createElement("div");
    noteViewerEle.classList.add("noteViewer");

    let viewButton = document.createElement("button");
    viewButton.appendChild(document.createTextNode("View"));

    let imageButton = document.createElement("button");
    imageButton.innerText = "Image";

    let deleteButton = document.createElement("button");
    deleteButton.appendChild(document.createTextNode("Delete"));

    let editButton = document.createElement("button");
    editButton.appendChild(document.createTextNode("Edit"));

    let cancelAddImageButton = document.createElement("button");
    cancelAddImageButton.innerText = "Cancel";

    let viewNoteCommandButtons = [editButton, deleteButton];
    let editNoteCommandButtons = [viewButton, imageButton, deleteButton];

    //resize img command buttons
    let resizeImgWidthCB = createButton("Width");
    let resizeImgHeightCB = createButton("Height");
    let resizeImgCB = createButton("Resize");
    let drawOnImgCB = createButton("Draw");
    let resizeImgCommandButtons = [resizeImgWidthCB, resizeImgHeightCB, resizeImgCB, drawOnImgCB];

    function createButton(text: string){
        let button = document.createElement("button");
        button.innerText = text;
        return button;
    }

    let idOfAutoSaveInterval: number;

    function createNewNote(){
        setCommandButtons(editNoteCommandButtons);
        note = new Note(Date.now(), Date.now());
        codeEditor.setTitle(note.title);
        codeEditor.setValue([]);
        setBody(codeEditor.containerEle);
        closePreview();
        startAutoSaveAndPreviewInterval();
        setHint("You can right click on view button to open preview window");
    }
    
    function* editNote(){
        setCommandButtons(editNoteCommandButtons);
        codeEditor.setTitle(note.title);
        codeEditor.setValue(note.components);
        setBody(codeEditor.containerEle);
        startAutoSaveAndPreviewInterval();
        setHint("You can right click on view button to open preview window");
    }

    function* viewNote() {
        setCommandButtons(viewNoteCommandButtons);
        while(noteViewerEle.firstChild)
            noteViewerEle.removeChild(noteViewerEle.firstChild);
        yield* generateNoteViewerContent(noteViewerEle, note);
        setBody(noteViewerEle);
    }

    function* viewManual(){
        setCommandButtons([]);
        while(noteViewerEle.firstChild)
            noteViewerEle.removeChild(noteViewerEle.firstChild);
        yield* generateNoteViewerContent(noteViewerEle, manual);
        setBody(noteViewerEle);
    }

    function removeNoteContentFromIndexAndCache(){
        //if not a new note, first remove all search key words from pre-modified content
        let titleTokens = tokenizeParagraph(note.title);
        for(let i = 0; i < titleTokens.tokenTypes.length; i++) {
            if(titleTokens.tokenTypes[i] === WordType.word) {
                let searchKeyWord = titleTokens.tokenValues[i];
                index.remove(searchKeyWord, false, note.id);
            }
        }
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
        let titleTokens = tokenizeParagraph(note.title);
        for(let i = 0; i < titleTokens.tokenTypes.length; i++) {
            if(titleTokens.tokenTypes[i] === WordType.word) {
                let searchKeyWord = titleTokens.tokenValues[i];
                index.putAsSearchKeyword(searchKeyWord, false, note.id);
            }
        }
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

    function startAutoSaveAndPreviewInterval(){
        idOfAutoSaveInterval = window.setInterval(function(){
            if(isContentChanged) {
                r(function*(){
                    isContentChanged = false;
                    yield* storeNote();
                    yield* refreshPreviewIfPreviewIsOpen(note);
                });
            }
        }, 500);
    }

    register(AppEvent.resultsPage, () => {
        closePreview();
        window.clearInterval(idOfAutoSaveInterval)
    });

    register(AppEvent.createNewNote, function(){
        if(note) setBackNavigation(note.title, note.id);
        createNewNote();
        addRecentlyViewed(note.id);
    });

    register(AppEvent.viewNote, function(noteId: number){
        closePreview();
        if(note) setBackNavigation(note.title, note.id);
        r(function*(){
            let idb: IDBDatabase = yield getIDB();
            note = yield StorageNamespace.getNote(idb, noteId);
            yield* viewNote();
            addRecentlyViewed(note.id);
        });
    });

    register(AppEvent.viewManual, function(){
        closePreview();
        r(function*(){
            yield* viewManual();
        });

    });

    editButton.onclick = function(){
        r(editNote);
    };

    viewButton.oncontextmenu = function(evt){
        evt.preventDefault();
        displayPreview(note);
        return false;
    };

    viewButton.onclick = function(){
        closePreview();
        setCommandButtons(viewNoteCommandButtons);
        r(function*(){
            yield* storeNote();
            yield* viewNote()
        });
    };

    imageButton.onclick = function(){
        codeEditor.startInsertingImg();
        setCommandButtons([]);
    };

    register(AppEvent.cancelUploadImage, function(){
        setCommandButtons(editNoteCommandButtons);
    });

    register(AppEvent.imgFocus, function(){
        setCommandButtons(resizeImgCommandButtons);
        setHint("left click to increase width/height/size, right click to decrease.");
    });

    register(AppEvent.imgLoseFocus, function(){
        setCommandButtons(editNoteCommandButtons);
        setHint("You can right click on view button to open preview window");
    });

    resizeImgWidthCB.onclick = function(){
        broadcast(AppEvent.incImgWidth);
    };

    resizeImgWidthCB.oncontextmenu = function(e) {
        broadcast(AppEvent.decImgWidth);
        e.preventDefault();
        return false;
    };

    resizeImgHeightCB.onclick = function(){
        broadcast(AppEvent.incImgHeight);
    };

    resizeImgHeightCB.oncontextmenu = function(e) {
        broadcast(AppEvent.decImgHeight);
        e.preventDefault();
        return false;
    };

    resizeImgCB.onclick = function(){
        broadcast(AppEvent.incImgSize);
    };

    resizeImgCB.oncontextmenu = function(e) {
        broadcast(AppEvent.decImgSize);
        e.preventDefault();
        return false;
    };

    drawOnImgCB.onclick = function(){
        setCommandButtons([]);
        broadcast(AppEvent.drawOnImg);
    };

    deleteButton.onclick = function(){
        //todo: ask the user to confirm
        r(deleteNote);
        broadcast(AppEvent.resultsPage);
    };

    let manual = createManual();
    function createManual() {
        let manual = new Note(Date.now(), Date.now());
        manual.title = "Manual";
        manual.permanent = true;
        manual.components.push({nodeName: "#text", value: "Oops, the manual is missing"});
        for(let com of manual.components) {
            com.tokens = tokenize(com);
        }
        return manual;
    }

    //this seemly awkward useless function is called by App.ts to ensure that this search results section module is created first
    export function init(){}

}
