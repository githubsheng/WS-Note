///<reference path="CodeEditor.ts"/>
///<reference path="AppEvents.ts"/>
///<reference path="CommandsSection.ts"/>
///<reference path="BodySection.ts"/>

namespace EVNoteSectionNamespace {
    
    import createCodeEditor = CodeEditorNamespace.createCodeEditor;
    import register = AppEventsNamespace.register;
    import AppEvent = AppEventsNamespace.AppEvent;
    import setCommandButtons = CommandsSectionNamespace.setCommandButtons;
    import setBody = BodySectionNamespace.setBody;

    let note: Note;
    let savedComponents: Component[];

    let saveButton = document.createElement("button");
    saveButton.appendChild(document.createTextNode("Done"));
    let deleteButton = document.createElement("button");
    deleteButton.appendChild(document.createTextNode("Delete"));
    let commandButtons = [saveButton, deleteButton];

    function storeNote() {
        //todo: convert to component list
        //todo: find tags & references
        //todo: save in db
        //todo: if not a new note, first remove all search key words from pre-modified content
        //todo: add search key words from new content to index
        //todo: update the tag cache
        //todo: remove all reference relationship that come from pre-modified content
        //todo: add reference relationship that come from modified content
        //todo: update the pre-modified content to the one just saved.
    }

    //todo: if performance is ok, auto save the note at an interval

    //todo: implement save button
    saveButton.onclick = function(){
        storeNote();
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

    let codeEditor = createCodeEditor();
    let bodyFrag = document.createDocumentFragment();
    bodyFrag.appendChild(codeEditor.containerEle);

    function createNewNote(){
        setCommandButtons(commandButtons);
        note = new Note(Date.now(), Date.now());
        codeEditor.setValue([]);
        setBody(bodyFrag);
    }

    register(AppEvent.createNewNote, createNewNote);

    //this seemly awkward useless function is called by App.ts to ensure that this search results section module is created first
    export function init(){}

}
