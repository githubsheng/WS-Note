///<reference path="AsyncUtil.ts"/>
///<reference path="Input.ts" />
///<reference path="OptionSection.ts" />
///<reference path="AutoComplete.ts" />
///<reference path="Storage.ts"/>
///<reference path="CodeEditor.ts"/>

import storage = StorageNamespace;

let usernameInput = new MaterialInput("Username");
document.body.appendChild(usernameInput.containerEle);

usernameInput.addValueChangeListener(function(value: string){
    console.log(value);
});

document.body.appendChild(createAutoComplete());

document.body.appendChild(createOptionsSection());

document.body.appendChild(document.createElement("hr"));

var titleInput = new MaterialInput("title");
document.body.appendChild(titleInput.containerEle);

var codeEditor = createCodeEditor();
document.body.appendChild(codeEditor.containerEle);

var saveButton = new MaterialRoundButton("fa fa-floppy-o");
saveButton.addMouseUpEventHandler(function(){
    r(function*(){
        let note = new Note(Date.now(), Date.now());
        note.title = titleInput.getValue();
        note.content = codeEditor.getValue();

        let idb: IDBDatabase = yield storage.getIDB();
        note = yield storage.storeNote(idb, note);

        console.log("note saved with id: " + note.id);
    });
});

document.body.appendChild(saveButton.containerEle);

