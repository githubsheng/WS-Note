///<reference path="Storage.ts"/>
///<reference path="TextProcessor.ts"/>
///<reference path="TagsCache.ts"/>
///<reference path="ReferenceCache.ts"/>
///<reference path="NoteNameCache.ts"/>

namespace IndexAndCacheBuilderNamespace {

    import iterateAllNotes = StorageNamespace.iterateAllNotes;
    import getIDB = StorageNamespace.getIDB;
    import KeywordProcessor = IndexNamespace.KeywordProcessor;
    import getIndex = IndexNamespace.getIndex;
    import setTagsForNote = TagsCacheNamespace.setTagsForNote;
    import addReference = ReferenceCacheNamespace.addReference;
    import addNoteName = NoteNameCacheNamespace.addNoteName;

    let index = getIndex();

    function buildIndexForNote(note: Note) {
        var tpc = new KeywordProcessor(note.components);
        while(tpc.hasNext()) {
            let c = tpc.nextWordCombination();
            if(c.prevComb !== undefined)
                index.putAsSearchKeyword(c.prevComb, true, note.id);
            if(c.cur !== undefined)
                index.putAsSearchKeyword(c.cur, false, note.id);
            if(c.nextComb !== undefined)
                index.putAsSearchKeyword(c.nextComb, false, note.id);
        }
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
        yield iterateAllNotes(idb, buildIndexAndCacheForNote);
    }

}