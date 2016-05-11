///<reference path="AsyncUtil.ts"/>
///<reference path="Input.ts" />
///<reference path="OptionSection.ts" />
///<reference path="AutoComplete.ts" />
///<reference path="Storage.ts"/>

let usernameInput = new MaterialInput("Username", "username-input");
document.body.appendChild(usernameInput.containerEle);

usernameInput.addValueChangeListener(function(value: string){
    console.log(value);
});

document.body.appendChild(createAutoComplete());

document.body.appendChild(createOptionsSection());

function *testStorage(): any{

    let idb:IDBDatabase = yield connectToDB();
    console.log("getting database");

    yield iterateAllNotes(idb, function(note: Note) {
        console.log(note);
    });
    console.log("done iterating all notes");

    let note = new Note(Date.now(), Date.now());

    note = yield storeNote(idb, note);
    console.log(note);

    let id = yield deleteNote(idb, 3);
    console.log("item with id " + id + " gets deleted");
}

runGenerator(testStorage);

