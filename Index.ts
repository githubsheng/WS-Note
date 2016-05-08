/**
 * Created by wangsheng on 7/5/16.
 */
/// <reference path="Note.ts" />

class Index {

    suggestKeyword(prefix:string):string[] {
        let end = getRandomInt(0, 10);
        return dummySuggestions.slice(0, end);
    }

    findNotes(keyword:string):Note[] {
        return [];
    }

    linkKeywordToNote(keyword: string, note: Note) {

    }

    unlinkKeywordFromNote(keyword: string, note: Note) {

    }

}

let index;

let dummySuggestions = ["hello", "there", "how you", "function", "switch case", "if else", "array length", "number", "linked list", "hash map"];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getIndex():Index{
    if(!index) {
        index = new Index();
        return index;
    } else {
        return index;
    }
}