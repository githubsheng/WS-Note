namespace NoteNameCacheNamespace {

    let noteNameCache: Map<number, string> = new Map();

    export function setNoteName(noteId: number, title: string) {
        noteNameCache.set(noteId, title);
    }

    export function getNoteName(noteId: number) {
        return noteNameCache.get(noteId);
    }

}