///<reference path="CodeEditor.ts"/>
///<reference path="AppEvents.ts"/>
///<reference path="CommandsSection.ts"/>
///<reference path="BodySection.ts"/>
///<reference path="TextProcessor.ts"/>
///<reference path="ReferenceCache.ts"/>
///<reference path="TagsCache.ts"/>
///<reference path="typings/chrome/chrome-app.d.ts"/>

namespace EVNoteSectionNamespace {
    
    import createCodeEditor = CodeEditorNamespace.createCodeEditor;
    import register = AppEventsNamespace.register;
    import AppEvent = AppEventsNamespace.AppEvent;
    import setCommandButtons = CommandsSectionNamespace.setCommandButtons;
    import setBody = BodySectionNamespace.setBody;
    import convertToComponentFormat = ContentTransformerNamespace.convertToComponentFormat;
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
    import AppWindow = chrome.app.window.AppWindow;

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

    let previewWindow: Window;
    let viewButtonPressedWhen: number = -1;
    let idOfAutoSaveInterval: number;

    function createNewNote(){
        setCommandButtons(editNoteCommandButtons);
        note = new Note(Date.now(), Date.now());
        codeEditor.setValue([]);
        setBody(codeEditor.containerEle);
        startAutoSaveInterval();
    }
    
    function* editNote(){
        setCommandButtons(editNoteCommandButtons);
        codeEditor.setValue(note.components);
        setBody(codeEditor.containerEle);
        startAutoSaveInterval();
    }

    function* viewNote() {
        setCommandButtons(viewNoteCommandButtons);
        let domFrag = yield* convertToStyledDocumentFragment(note.components);
        while(noteViewerEle.firstChild)
            noteViewerEle.removeChild(noteViewerEle.firstChild);
        noteViewerEle.appendChild(domFrag);
        setBody(noteViewerEle);
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
        let components:Component[] = convertToComponentFormat(codeEditor.containerEle);
        note.components = components;
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

    function closePreviewWindow(){
        if(previewWindow) previewWindow.close();
    }

    function openPreviewWindow(){
        if(chrome && chrome.app && chrome.app.window) {
            closePreviewWindow();
            chrome.app.window.create('test/html/viewer.html', {
                'bounds': {
                    'width': 400,
                    'height': 400
                }
            }, function(appWindow: AppWindow) {
                previewWindow = appWindow.contentWindow;
            });
        } else {
            previewWindow = window.open("viewer.html");
        }
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
            yield viewNote();
        });
    });

    editButton.onclick = function(){
        r(editNote);
    };

    viewButton.onmousedown = function(){
        viewButtonPressedWhen = Date.now();
    };

    viewButton.onmouseup = function(){
        let viewButtonReleasedWhen = Date.now();
        if(viewButtonReleasedWhen - viewButtonPressedWhen > 1000) {
            //this is a long press
            openPreviewWindow();
        } else {
            closePreviewWindow();
            setCommandButtons(viewNoteCommandButtons);
            r(function*(){
                yield storeNote();
                yield viewNote()
            });
        }
    };

    //todo: implement delete button
    deleteButton.onclick = function(){
        //todo: show confirm dialog
        deleteNote();
        broadcast(AppEvent.resultsPage);
    };

    //this seemly awkward useless function is called by App.ts to ensure that this search results section module is created first
    export function init(){}

}
