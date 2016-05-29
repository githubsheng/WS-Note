namespace ReferenceCacheNamespace {

    let referenceCache: Map<number, Set<number>> = new Map();

    export function addReference(noteId: number, referencedBy: number) {
        if(referenceCache.get(noteId) === undefined) referenceCache.set(noteId, new Set());
        let referencedByNotes = referenceCache.get(noteId);
        referencedByNotes.add(referencedBy);
    }

    export function removeReference(noteId: number, referencedBy: number) {
        if(referenceCache.get(noteId) === undefined) return;
        let referencedByNotes = referenceCache.get(noteId);
        referencedByNotes.delete(referencedBy);
    }

    export function getIdOfNotesThatReferences(noteId: number) {
        let referencedByNotes = referenceCache.get(noteId);
        return referencedByNotes === undefined ? new Set() : referencedByNotes;
    }

}
