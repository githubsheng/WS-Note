///<reference path="CommonModels.ts"/>

namespace DigestNamespace {

    function findSmallestPartThatCoveringKeyWordSet(paragraph: string[], keyWords: Set<string>){
        let keywordsToCount: Map<string, number> = new Map();
        let left = 0, right = 0;
        let start= -1, end = -1;
        while(right < paragraph.length) {
            while (right < paragraph.length && keywordsToCount.size < keyWords.size) {
                let textAtRight = paragraph[right].toLowerCase();
                if(keyWords.has(textAtRight)){
                    keywordsToCount.set(
                        textAtRight,
                        keywordsToCount.has(textAtRight)
                            ? keywordsToCount.get(textAtRight) + 1
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
                let textAtLeft = paragraph[left].toLowerCase();
                if(keyWords.has(textAtLeft)) {
                    let keywordCount = keywordsToCount.get(textAtLeft);
                    keywordsToCount.set(textAtLeft, --keywordCount);
                    if(keywordCount == 0) {
                        keywordsToCount.delete(textAtLeft);
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
            let word = digest[i].toLowerCase();
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
            if(keyWords.has(word.toLowerCase())) result.push(word);
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

    function createContentBeforeSmallestPartCoveringAllKeyWords(para: string[], startOfSmallestPartCoveringAllKeyWords: number, keyWords: Set<string>, preLength: number){
        if(startOfSmallestPartCoveringAllKeyWords === 0) return undefined; //smallest part covering all keys happen to be the first word.
        let start = Math.max(0, startOfSmallestPartCoveringAllKeyWords - preLength); //try add preLength words before...
        let preTokens = para.slice(start, startOfSmallestPartCoveringAllKeyWords);

        let frag = convertTokensIntoTextNodeAndSpan(preTokens, keyWords);
        frag.insertBefore(document.createTextNode("..."), frag.firstChild);
        return frag;
    }

    function createContentAfterSmallestPartCoveringAllKeyWords(para: string[], endOfSmallestPartCoveringAllKeyWords: number, keyWords: Set<string>, afterLength: number){
        if(endOfSmallestPartCoveringAllKeyWords === para.length - 1) return undefined; //smallest part covering all keys happen to be the last word.
        let end = Math.min(para.length - 1, endOfSmallestPartCoveringAllKeyWords + afterLength); //try add afterLength words after...
        let afterTokens = para.slice(endOfSmallestPartCoveringAllKeyWords + 1, end + 1);

        let frag = convertTokensIntoTextNodeAndSpan(afterTokens, keyWords);
        frag.appendChild(document.createTextNode("..."));
        return frag;
    }

    function convertTokensIntoTextNodeAndSpan(tokens: string[], keyWords: Set<string>): DocumentFragment{
        let buffer = [];
        let frag = document.createDocumentFragment();
        for(let token of tokens) {
            if(keyWords.has(token.toLowerCase())) {
                frag.appendChild(document.createTextNode(buffer.join("")));
                buffer = [];
                appendKeyWordSpanToFrag(frag, token);
            } else {
                buffer.push(token);
            }
        }
        frag.appendChild(document.createTextNode(buffer.join("")));
        return frag;
    }

    /*
     * a digest consist of three parts:
     *
     * pre + middle + after
     *
     * middle is smallest part that covers all key words
     */
    export function digest(components: Component[], keyWords: Set<string>) {
        let componentsWithTokens = components.filter((c: Component) => {return c.codeLanguage === undefined && c.tokens !== undefined});
        let listOfTokens = componentsWithTokens.map((c: Component) => {return c.tokens.tokenValues});
        let para: string[] = [].concat(...listOfTokens);
        let middlePart = findSmallestPartThatCoveringKeyWordSet(para, keyWords);
        let middleTokens = para.slice(middlePart.start, middlePart.end + 1);
        let segmentBetweenKeyWords = findSegmentsBetweenKeyWords(middleTokens, keyWords);
        let keyWordsInDisplayOrder = findKeyWordsInDisplayOrder(middleTokens, keyWords);

        const middleLengthLimit = 80;
        let preLength = 6, afterLength = 6;
        let digestFrag;
        if(middleTokens.length > middleLengthLimit) {
            let requiredLengthForSegments = calculateSegmentLengths(segmentBetweenKeyWords.map((s: string[]) => s.length), 40);
            shrinkSegments(segmentBetweenKeyWords, requiredLengthForSegments);
            digestFrag = joinSegmentsWithKeyWords(segmentBetweenKeyWords, keyWordsInDisplayOrder);
        } else {
            digestFrag = convertTokensIntoTextNodeAndSpan(middleTokens, keyWords);
            //middle is short, that means I can display longer pre and longer after.
            let additionalQuotaForPreAndAfter = Math.floor((middleLengthLimit - middleTokens.length)/2);
            preLength += Math.floor(additionalQuotaForPreAndAfter);
            afterLength += Math.floor(additionalQuotaForPreAndAfter);
        }

        let pre = createContentBeforeSmallestPartCoveringAllKeyWords(para, middlePart.start, keyWords, preLength);
        if(pre)digestFrag.insertBefore(pre, digestFrag.firstChild);
        let after = createContentAfterSmallestPartCoveringAllKeyWords(para, middlePart.end, keyWords, afterLength);
        if(after)digestFrag.appendChild(after);
        return digestFrag;
    }

}

