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

    let id = yield addNote(idb, new Note(1, 1));
    console.log("id of the new entity is " + id);
}

runGenerator(testStorage);

