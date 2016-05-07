/**
 * Created by wangsheng on 7/5/16.
 */
/// <reference path="Note.ts" />
class Index {
    suggestKeyword(prefix) {
        return ["aa", "bb"];
    }
    findNotes(keyword) {
        return [];
    }
    linkKeywordToNote(keyword, note) {
    }
    unlinkKeywordFromNote(keyword, note) {
    }
}
let index;
function getIndex() {
    if (!index) {
        index = new Index();
        return index;
    }
    else {
        return index;
    }
}
//# sourceMappingURL=Index.js.map