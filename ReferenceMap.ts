namespace ReferenceMapNamespace {

    let referenceMap: Map<number, Set<number>> = new Map();

    export function addReference(noteId: number, referencedBy: number) {
        if(referenceMap.get(noteId) === undefined) referenceMap.set(noteId, new Set());
        let referencedByNotes = referenceMap.get(noteId);
        referencedByNotes.add(referencedBy);
    }

    export function removeReference(noteId: number, referencedBy: number) {
        if(referenceMap.get(noteId) === undefined) return;
        let referencedByNotes = referenceMap.get(noteId);
        referencedByNotes.delete(referencedBy);
    }

    export function getIdOfNotesThatReferences(noteId: number) {
        let referencedByNotes = referenceMap.get(noteId);
        return referencedByNotes === undefined ? new Set() : referencedByNotes;
    }

}
