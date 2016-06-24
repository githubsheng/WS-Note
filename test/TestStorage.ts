///<reference path="../Storage.ts"/>
///<reference path="TestUtil.ts"/>
///<reference path="../Util.ts"/>
///<reference path="../ImageCanvasUtility.ts"/>

namespace TestStorageNamespace {

    import getIDB = StorageNamespace.getIDB;
    import iterateAllNotes = StorageNamespace.iterateNotes;
    import getNote = StorageNamespace.getNote;
    import storeNote = StorageNamespace.storeNote;
    import deleteNote = StorageNamespace.deleteNote;
    import storeImageBlob = StorageNamespace.storeImageBlob;
    import getImageBlob = StorageNamespace.getImageBlob;

    import createImageFromRegularURL = Utility.createImageFromRegularURL;
    import getBlobFromCanvas = Utility.getBlobFromCanvas;
    import createCanvasBasedOnImage = Utility.createCanvasBasedOnImage;
    import createImageFromBlob = Utility.createImageFromBlob;
    import r = Utility.r;
    import shouldBeTrue = TestUtilNamespace.shouldBeTrue;
    import shouldNotBeUndefined = TestUtilNamespace.shouldNotBeUndefined;
    import shouldBeInstanceOf = TestUtilNamespace.shouldBeInstanceOf;
    import shouldBeUndefined = TestUtilNamespace.shouldBeUndefined;
    import shouldBeEqual = TestUtilNamespace.shouldBeEqual;
    import arrayShouldBeIdentical = TestUtilNamespace.arrayShouldBeIdentical;

    export function* storeTestImage(idb: IDBDatabase): IterableIterator<any> {
        let img = yield createImageFromRegularURL("../resources/test.jpeg");
        let canvas = createCanvasBasedOnImage(img);
        let blob = yield getBlobFromCanvas(canvas);
        return yield storeImageBlob(idb, blob);
    }

    export function runStorageTest() {

        function* testGetIDB() {
            window.indexedDB.deleteDatabase("test");
            let idb = yield getIDB();
            shouldNotBeUndefined(idb);
            shouldBeInstanceOf(idb, IDBDatabase);
            return idb;
        }

        //this function should be called after `testGetIDB`
        function* testGetAndStoreNote(idb:IDBDatabase) {
            //assuming `testGetIDB` is run, I have a fresh new database now. the first record
            //should have an id of 1.
            const noteId = 1;
            let note:Note = yield getNote(idb, noteId);
            //for now i haven't stored anything, therefore i expect undefined as result.
            shouldBeUndefined(note);

            note = new Note(Date.now(), Date.now());
            note.content = "My first note here!";
            note.title = "Note Number One!";

            note = yield storeNote(idb, note);
            //check an id is properly generated for the note just stored.
            shouldBeEqual(note.id, noteId);

            //try to get a clone by reading from db.
            let noteGotFromDB:Note = yield getNote(idb, noteId);
            shouldBeEqual(note.title, noteGotFromDB.title);
            shouldBeEqual(note.content, noteGotFromDB.content);
            shouldBeEqual(note.createdWhen, noteGotFromDB.createdWhen);
        }

        //this method should only be called after `testGetAndStoreNote`
        function* testDeleteNote(idb:IDBDatabase):IterableIterator<any> {
            //assuming `testGetAndStoreNote` has finished. a note with id of 1 should be
            //available now.
            const noteId = 1;
            yield deleteNote(idb, noteId);
            let note = yield getNote(idb, noteId);
            shouldBeUndefined(note);
        }

        function* testIterateAllNotes(idb:IDBDatabase):IterableIterator<any> {
            let note1 = new Note(Date.now(), Date.now());
            note1.content = "aaa";
            let note2 = new Note(Date.now(), Date.now());
            note2.content = "bbb";
            let note3 = new Note(Date.now(), Date.now());
            note3.content = "ccc";

            yield Promise.all([storeNote(idb, note1), storeNote(idb, note2), storeNote(idb, note3)]);

            let results:string[] = [];
            yield iterateAllNotes(idb, function (note:Note) {
                results.push(note.content);
            });

            arrayShouldBeIdentical(["aaa", "bbb", "ccc"], results);
        }

        function* testStoreImage(idb: IDBDatabase): IterableIterator<any> {
            let id = yield* storeTestImage(idb);
            shouldBeTrue(Number.isInteger(id));
            shouldBeTrue(id > 0);
            return id;
        }

        //to see if the image is rendered correctly is better done by eyes...
        function* getImage(idb: IDBDatabase, imgId: number): IterableIterator<any> {
            let blob = yield getImageBlob(idb, imgId);
            let img:HTMLImageElement = yield createImageFromBlob(blob);
            let div = document.createElement("div");
            div.appendChild(document.createTextNode("image fetched from database:"));
            div.appendChild(document.createElement("br"));
            div.appendChild(img);
            div.style.marginTop = "10px";
            document.body.appendChild(div);

            div = document.createElement("div");
            div.appendChild(document.createTextNode("original image:"));
            div.appendChild(document.createElement("br"));
            img = document.createElement("img");
            img.src = "../resources/test.jpeg";
            div.appendChild(img);
            div.style.marginTop = "10px";
            document.body.appendChild(div);
        }

        function* runAllTest():IterableIterator<any> {
            let idb:IDBDatabase = yield* testGetIDB();
            yield* testGetAndStoreNote(idb);
            yield* testDeleteNote(idb);
            yield* testIterateAllNotes(idb);
            let imgId = yield* testStoreImage(idb);
            yield* getImage(idb, imgId);
        }

        r(runAllTest);
    }


}