namespace TagsCacheNamespace {

    let tagCache: Map<number, string[]> = new Map();

    export function getTagsOfNote(noteId: number): string[] {
        let tags = tagCache.get(noteId);
        return tags === undefined ? [] : tags;
    }

    export function setTagsForNote(noteId: number, tags: string[]) {
        tagCache.set(noteId, tags);
    }

}