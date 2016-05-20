///<reference path="../Storage.ts"/>
///<reference path="TestUtil.ts"/>
///<reference path="../AsyncUtil.ts"/>
///<reference path="../FreeDraw.ts"/>

namespace TestStorageNamespace {

    import getIDB = StorageNamespace.getIDB;
    import iterateAllNotes = StorageNamespace.iterateAllNotes;
    import getNote = StorageNamespace.getNote;
    import storeNote = StorageNamespace.storeNote;
    import deleteNote = StorageNamespace.deleteNote;
    import storeImageBlob = StorageNamespace.storeImageBlob;
    import getImageBlob = StorageNamespace.getImageBlob;

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
            note.url = "xxx";

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

        const imgId = 1;
        const testImagePath = "test.jpg";

        function* testStoreImage(idb: IDBDatabase): IterableIterator<any> {
            let img = yield createImageFromRegularURL(testImagePath);
            let canvas = createCanvasBasedOnImage(img);
            let blob = yield getBlobFromCanvas(canvas);
            let id = yield storeImageBlob(idb, blob);
            shouldBeEqual(id, imgId);
        }

        //to see if the image is rendered correctly is better done by eyes...
        function* getImage(idb: IDBDatabase): IterableIterator<any> {
            let blob = yield getImageBlob(idb, imgId);
            let img:HTMLImageElement = yield createImageFromBlob(blob);
            let div = document.createElement("div");
            div.appendChild(img);
            document.body.appendChild(div);
        }

        function* runAllTest():IterableIterator<any> {
            let idb:IDBDatabase = yield* testGetIDB();
            yield* testGetAndStoreNote(idb);
            yield* testDeleteNote(idb);
            yield* testIterateAllNotes(idb);
            yield* testStoreImage(idb);
            yield* getImage(idb);
        }

        r(runAllTest);
    }


}