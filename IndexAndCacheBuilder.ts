///<reference path="Storage.ts"/>
///<reference path="TextProcessor.ts"/>
///<reference path="TagsCache.ts"/>
///<reference path="ReferenceCache.ts"/>
///<reference path="NoteNameCache.ts"/>

namespace IndexAndCacheBuilderNamespace {

    import iterateNotes = StorageNamespace.iterateNotes;
    import getIDB = StorageNamespace.getIDB;
    import KeywordProcessor = IndexNamespace.KeywordProcessor;
    import getIndex = IndexNamespace.getIndex;
    import setTagsForNote = TagsCacheNamespace.setTagsForNote;
    import addReference = ReferenceCacheNamespace.addReference;
    import addNoteName = NoteNameCacheNamespace.setNoteName;

    let index = getIndex();

    function buildIndexForNote(note: Note) {
        //index the title, this is a bit ugly because KeywordProcessor only takes in Component[]
        //it does not take a string directly, but note.title is a string, so here I just simply index every word in
        //note.title directly. no word combination is indexed here in this case. might need to fix this in the future version.
        let titleWords = note.title.split(" ");
        titleWords.forEach(function(e) {
           index.putAsSearchKeyword(e, false, note.id);
        });

        //index the content
        var tpc = new KeywordProcessor(note.components);
        let keyWords = tpc.getKeyWords();
        keyWords.forEach(function(e){
            let keyWord = e[0];
            let reversed = e[1];
            index.putAsSearchKeyword(keyWord, reversed, note.id);
        })
    }

    function buildCacheForNote(note: Note) {
        setTagsForNote(note.id, note.tags);
        addNoteName(note.id, note.title);
        for(let i = 0; i < note.references.length; i++) {
            addReference(note.references[i], note.id);
        }
    }

    function buildIndexAndCacheForNote(note: Note) {
        buildIndexForNote(note);
        buildCacheForNote(note);
    }

    export function* buildIndexAndCache(): IterableIterator<any> {
        let idb: IDBDatabase = yield getIDB();
        yield iterateNotes(idb, buildIndexAndCacheForNote);
    }

}