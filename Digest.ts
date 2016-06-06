///<reference path="CommonModels.ts"/>

namespace DigestNamespace {

    function findSmallestPartThatCoveringKeyWordSet(paragraph: string[], keyWords: Set<string>){
        let keywordsToCount: Map<string, number> = new Map();
        let left = 0, right = 0;
        let start= -1, end = -1;
        while(right < paragraph.length) {
            while (right < paragraph.length && keywordsToCount.size < keyWords.size) {
                if(keyWords.has(paragraph[right])){
                    keywordsToCount.set(
                        paragraph[right],
                        keywordsToCount.has(paragraph[right])
                            ? keywordsToCount.get(paragraph[right]) + 1
                            : 1);
                }
                ++right;
            }

            if(keywordsToCount.size === keyWords.size
                && (start == -1 && end == -1)
                || (right - 1 - left < end - start)) {
                start = left;
                end = right - 1;
            }

            while(left < right && keywordsToCount.size === keyWords.size) {
                if(keyWords.has(paragraph[left])) {
                    let keywordCount = keywordsToCount.get(paragraph[left]);
                    keywordsToCount.set(paragraph[left], --keywordCount);
                    if(keywordCount == 0) {
                        keywordsToCount.delete(paragraph[left]);
                        if((start == -1 && end == -1)
                            || right - 1 - left < end - start) {
                            start = left;
                            end = right - 1;
                        }
                    }
                }
                ++left;
            }
        }
        return {start: start, end: end};
    }

    function findSegmentsBetweenKeyWords(digest: string[], keyWords: Set<string>): string[][] {
        let segments: string[][] = [];
        let start = -1;
        for(let i = 0; i < digest.length; i++) {
            let word = digest[i];
            if(keyWords.has(word)) {
                if(start > 0) segments.push(digest.slice(start, i));
                start = i + 1;
            }
        }
        return segments;
    }

    function findKeyWordsInDisplayOrder(digest: string[], keyWords: Set<string>): string[] {
        let result: string[] = [];
        for(let word of digest) {
            if(keyWords.has(word)) result.push(word);
        }
        return result;
    }

    function shrinkSegments(segments: string[][], requiredSegLengths: number[]) {
        segments.forEach(function(s: string[], idx){
            let requiredLength = requiredSegLengths[idx];
            if(s.length > requiredLength) {
                s.splice(Math.floor(requiredLength / 2), s.length - requiredLength, "...");
            }
        });
    }

    function appendKeyWordSpanToFrag(frag: DocumentFragment, keyWord: string) {
        let keyWordSpan = document.createElement("span");
        keyWordSpan.classList.add("keyWord");
        keyWordSpan.appendChild(document.createTextNode(keyWord));
        frag.appendChild(keyWordSpan);
    }

    function joinSegmentsWithKeyWords(segments: string[][], keyWords: string[]): DocumentFragment {
        let frag = document.createDocumentFragment();
        appendKeyWordSpanToFrag(frag, keyWords[0]);
        for(let i = 0; i < segments.length; i++) {
            frag.appendChild(document.createTextNode(segments[i].join("")));
            appendKeyWordSpanToFrag(frag, keyWords[i+1]);
        }
        return frag;
    }

    function calculateSegmentLengths(tokenSegmentLengths: number[], requiredMaxTotalLength: number){
        let maxSegLength = 0;
        let totalSegLength = 0;
        for(let i = 0; i < tokenSegmentLengths.length; i++) {
            totalSegLength += tokenSegmentLengths[i];
            maxSegLength = Math.max(maxSegLength, tokenSegmentLengths[i]);
        }

        if(totalSegLength < requiredMaxTotalLength) return tokenSegmentLengths;

        let toRemove = totalSegLength - requiredMaxTotalLength;

        while(toRemove > 0) {
            if(maxSegLength <= 3) break; //each segment is so small it does not make sense to remove any tokens anymore.
            for(let i = 0; i < tokenSegmentLengths.length; i++) {
                if(tokenSegmentLengths[i] === maxSegLength) {
                    tokenSegmentLengths[i] = tokenSegmentLengths[i] - 1;
                    toRemove--;
                }
            }
            maxSegLength--;
        }
        return tokenSegmentLengths;
    }

    function createContentBeforeSmallestPartCoveringAllKeyWords(para: string[], startOfSmallestPartCoveringAllKeyWords: number){
        if(startOfSmallestPartCoveringAllKeyWords === 0) return undefined; //smallest part covering all keys happen to be the first word.
        let start = Math.max(0, startOfSmallestPartCoveringAllKeyWords - 6); //try add 3 words before...
        let pre = para.slice(start, startOfSmallestPartCoveringAllKeyWords).join("");
        if(start > 0) pre = "..." + pre;
        return document.createTextNode(pre);
    }

    function createContentAfterSmallestPartCoveringAllKeyWords(para: string[], endOfSmallestPartCoveringAllKeyWords: number){
        if(endOfSmallestPartCoveringAllKeyWords === para.length - 1) return undefined; //smallest part covering all keys happen to be the last word.
        let end = Math.min(para.length - 1, endOfSmallestPartCoveringAllKeyWords + 6); //try add 3 words after...
        let after = para.slice(endOfSmallestPartCoveringAllKeyWords + 1, end + 1).join("");
        if(end < para.length - 1) after = after + "...";
        return document.createTextNode(after);
    }

    export function findDigestForMultipleKeyWords(components: Component[], keyWords: Set<string>) {
        let componentsWithTokens = components.filter((c: Component) => {return c.tokens !== undefined});
        let listOfTokens = componentsWithTokens.map((c: Component) => {return c.tokens.tokenValues});
        let para: string[] = [].concat(...listOfTokens);
        let smallestPartCoveringAllKeyWords = findSmallestPartThatCoveringKeyWordSet(para, keyWords);
        let digest = para.slice(smallestPartCoveringAllKeyWords.start, smallestPartCoveringAllKeyWords.end + 1);
        let segmentBetweenKeyWords = findSegmentsBetweenKeyWords(digest, keyWords);
        let keyWordsInDisplayOrder = findKeyWordsInDisplayOrder(digest, keyWords);
        let requiredLengthForSegments = calculateSegmentLengths(segmentBetweenKeyWords.map((s: string[]) => s.length), 40);
        shrinkSegments(segmentBetweenKeyWords, requiredLengthForSegments);
        let frag = joinSegmentsWithKeyWords(segmentBetweenKeyWords, keyWordsInDisplayOrder);
        let pre = createContentBeforeSmallestPartCoveringAllKeyWords(para, smallestPartCoveringAllKeyWords.start);
        if(pre)frag.insertBefore(pre, frag.firstChild);
        let after = createContentAfterSmallestPartCoveringAllKeyWords(para, smallestPartCoveringAllKeyWords.end);
        if(after)frag.appendChild(after);
        return frag;
    }

}

