/**
 * Created by wangsheng on 7/5/16.
 */
/// <reference path="Note.ts" />

class Index {

    suggestKeyword(prefix:string):string[] {
        return ["aa", "bb"];
    }

    findNotes(keyword:string):Note[] {
        return [];
    }

    linkKeywordToNote(keyword: string, note: Note) {

    }

    unlinkKeywordFromNote(keyword: string, note: Note) {

    }

}