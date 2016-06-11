///<reference path="CommonModels.ts"/>

namespace DigestNamespace {

    const middleLengthLimit = 80;

    function findPartCoveringMultipleOccurrencesOfSingleKeyWord(paragraph: string[], keyWord) {
        let indexOfFirstOccurrenceOfKeyWord = 0;
        for (let i = 0; i < paragraph.length; i++) {
            if(paragraph[i].toLowerCase() === keyWord) {
                indexOfFirstOccurrenceOfKeyWord = i;
                break;
            }
        }

        let partLength = 1;
        let foundOccurrences = 1;
        let middleStart = indexOfFirstOccurrenceOfKeyWord; let middleEnd = middleStart;
        for(let i = indexOfFirstOccurrenceOfKeyWord; (i < paragraph.length) && (partLength < middleLengthLimit || foundOccurrences < 4); i++){
            if(paragraph[i].toLowerCase() === keyWord) {
                foundOccurrences++;
                middleEnd = i;
            }
            partLength++;
        }

        return {start: middleStart, end: middleEnd};
    }

    function findSmallestPartThatCoveringAllDifferentKeyWords(paragraph: string[], keyWords: Set<string>){
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

    //this method assumes the following pattern.
    //1. segments are separated by key words.
    //2. start with key word and end with key word.
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

    //this method assumes the following pattern.
    //1. segments are separated by key words.
    //2. start with key word and end with key word.
    function joinSegmentsWithKeyWordsIntoFrag(segments: string[][], keyWords: string[]): DocumentFragment {
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

    function convertTokensIntoTextNodeAndSpan(para: string[], keyWords: Set<string>, start?: number, end?: number): DocumentFragment{
        let buffer = [];
        let frag = document.createDocumentFragment();
        if(start === undefined) start = 0;
        if(end === undefined) end = para.length - 1;
        for(let i = start; i <= end; i++) {
            let token = para[i];
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

    function appendKeyWordSpanToFrag(frag: DocumentFragment, keyWord: string) {
        let keyWordSpan = document.createElement("span");
        keyWordSpan.classList.add("keyWord");
        keyWordSpan.appendChild(document.createTextNode(keyWord));
        frag.appendChild(keyWordSpan);
    }

    /*
     * a digest consist of three parts:
     *
     * pre + middle + after
     *
     * middle is smallest part that covers all key words
     */
    export function digest(components: Component[], keyWords: Set<string>) {
        //this digest algorithmn unfortunately is not able to work when dealing word combo. so I need to decouple a word combo into two search key words.
        let temp = new Set<string>();
        for(let keyWord of keyWords.values()) {
            let s = keyWord.split(" ");
            for(let e of s) temp.add(e);
        }
        keyWords = temp;

        let digestFrag = document.createDocumentFragment();

        let componentsWithTokens = components.filter((c: Component) => {
            return (c.codeLanguage === undefined && c.tokens !== undefined) || c.nodeName === "br"; //I need br since i need to transform br into white space.
        });
        let listOfTokens = componentsWithTokens.map((c: Component) => {
            if(c.nodeName === "br") return [" "]; //br is treated as a whitespace. otherwise contents in two different lines won't be separated in digest
            return c.tokens.tokenValues
        });
        let para: string[] = [].concat(...listOfTokens);

        let middlePart:{start: number, end: number};

        if(keyWords.size === 1) {
            let keyWord = keyWords.keys().next().value;
            middlePart = findPartCoveringMultipleOccurrencesOfSingleKeyWord(para, keyWord);
        } else {
            middlePart = findSmallestPartThatCoveringAllDifferentKeyWords(para, keyWords);
        }

        if(middlePart.start === middlePart.end) {
            //special case, middle part is a single token.
            appendKeyWordSpanToFrag(digestFrag, para[middlePart.start]);
        } else {
            //middle part starts with an occurrence of a key word and ends with an occurrence of a key word
            let middleTokens = para.slice(middlePart.start, middlePart.end + 1);

            if(middleTokens.length > middleLengthLimit) {
                let segmentBetweenKeyWords = findSegmentsBetweenKeyWords(middleTokens, keyWords);
                let keyWordsInDisplayOrder = findKeyWordsInDisplayOrder(middleTokens, keyWords);
                let requiredLengthForSegments = calculateSegmentLengths(segmentBetweenKeyWords.map((s: string[]) => s.length), middleLengthLimit);
                shrinkSegments(segmentBetweenKeyWords, requiredLengthForSegments);
                digestFrag.appendChild(joinSegmentsWithKeyWordsIntoFrag(segmentBetweenKeyWords, keyWordsInDisplayOrder));
            } else {
                digestFrag.appendChild(convertTokensIntoTextNodeAndSpan(middleTokens, keyWords));

            }
        }

        const maxTotalDigestLength = 90;
        let preStart = middlePart.start - 1, preEnd = middlePart.start - 1, afterStart = middlePart.end + 1, afterEnd = middlePart.end + 1;
        while(preEnd - preStart + 1 + Math.min(middlePart.end - middlePart.start + 1, middleLengthLimit) + afterEnd - afterStart + 1 <= maxTotalDigestLength
            && !(preStart === 0 && afterEnd === para.length - 1)) {
            preStart = Math.max(0, preStart - 1);
            afterEnd = Math.min(para.length - 1, afterEnd + 1);
        }
        digestFrag.insertBefore(convertTokensIntoTextNodeAndSpan(para, keyWords, preStart, preEnd), digestFrag.firstChild);
        digestFrag.appendChild(convertTokensIntoTextNodeAndSpan(para, keyWords, afterStart, afterEnd));
        if(preStart > 0) digestFrag.insertBefore(document.createTextNode("..."), digestFrag.firstChild);
        if(afterEnd < para.length - 1) digestFrag.appendChild(document.createTextNode("..."));

        return digestFrag;
    }

}

