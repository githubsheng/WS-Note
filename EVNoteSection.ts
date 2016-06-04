///<reference path="CodeEditor.ts"/>
///<reference path="AppEvents.ts"/>
///<reference path="CommandsSection.ts"/>
///<reference path="BodySection.ts"/>
///<reference path="TextProcessor.ts"/>
///<reference path="ReferenceCache.ts"/>
///<reference path="TagsCache.ts"/>

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

    let index = getIndex();

    let note: Note;

    let codeEditor = createCodeEditor();
    let bodyFrag = document.createDocumentFragment();
    bodyFrag.appendChild(codeEditor.containerEle);

    let viewButton = document.createElement("button");
    viewButton.appendChild(document.createTextNode("View"));
    let deleteButton = document.createElement("button");
    deleteButton.appendChild(document.createTextNode("Delete"));
    let commandButtons = [viewButton, deleteButton];

    function createNewNote(){
        setCommandButtons(commandButtons);
        note = new Note(Date.now(), Date.now());
        codeEditor.setValue([]);
        setBody(bodyFrag);
    }

    function* storeNote(): IterableIterator<any> {
        if(note.id) {
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
            //previous related tags are override later when tags from new content gets set

            //if not a new note, remove related references in reference cache
            note.references.forEach(function(referenceId: number){
                removeReference(referenceId, note.id);
            });
        }
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

    //todo: if performance is ok, auto save the note at an interval

    //todo: implement save button
    viewButton.onclick = function(){
        r(storeNote);
        //todo: close preview window if there is one
        //todo: convert the component list to styled note
        //todo: show view note section (set command buttons, set body)
    };

    function deleteNote() {
        //todo: remove it from db
        //todo: remove all search key words from pre-modified content
        //todo: remove all related tags in tag cache
        //todo: remove all reference relationship that come from pre-modified content
        //todo: set `note` to undefined
        //todo: set `savedComponents` to undefined
    }

    //todo: implement delete button
    deleteButton.onclick = function(){
        //todo: show confirm dialog
        deleteNote();
        //todo: go back to blank search result page.
    };



    register(AppEvent.createNewNote, createNewNote);

    //this seemly awkward useless function is called by App.ts to ensure that this search results section module is created first
    export function init(){}

}
