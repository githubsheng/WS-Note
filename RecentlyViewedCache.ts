namespace RecentlyViewedCacheNamespace {

    let recentlyViewed = new Set<number>();

    export function addRecentlyViewed(noteId: number) {
        recentlyViewed.add(noteId);
    }

    export function isRecentlyViewed(noteId: number) {
        return recentlyViewed.has(noteId);
    }

}