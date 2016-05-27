var wangsheng: HTMLDivElement;

namespace SyntaxHighlightNamespace {

    let keywords = ["function", "var", "let", "return", "if", "for", "while", "else"];

    function isKeyWord(text: string): boolean {
        return keywords.indexOf(text) !== -1;
    }

    let specialSymbol = ['{', '}', '.', '=', ';', '(', ')', "+", "-", "%", "/", "!"];

    export function parseCode(parent: Node, text: string) {

        /**
         * delimiters include whitespace, and special code symbols such as ; { } ( ) and so on. this variable indicates
         * whether the cursor in the following for-loop is on a normal character, or on a delimiter.
         */
        let isOnNoneDelimiter = false;
        /**
         *  _means whitespace
         *  segmentStartIndex
         *  |
         *  |
         *  _______function foo() {};
         *         |
         *      keywordCandidateStartIndex
         */
        let keywordCandidateStartIndex = -1;
        let segmentStartIndex = 0;

        for(let i = 0; i < text.length; i++) {
            let char = text[i];
            let isSpecialSymbol = specialSymbol.indexOf(char) > -1 ;
            let isWhitespace = char === ' ';
            let isDelimiter = isWhitespace || isSpecialSymbol;

            if(isOnNoneDelimiter) {
                //if previously I am looking at normal characters, and now for the first time I am looking at delimiters,
                //then I have found a word.
                /**
                 * keywordCandidateStartIndex
                 * |
                 * function   <---before cursor is on delimiter it was `isOnNoneDelimiter`
                 *         |
                 *      white space delimiter / cursor position
                 */
                if(isDelimiter) {
                    //from the above comments you can see the founded word is text.substring(keywordCandidateStartIndex, i)
                    let keywordCandidate = text.substring(keywordCandidateStartIndex, i);
                    if(isKeyWord(keywordCandidate)) {
                        //if this candidate turns out to be a keyword, then i need to give it a different styles.
                        let previous = text.substring(segmentStartIndex, keywordCandidateStartIndex);
                        parent.appendChild(document.createTextNode(previous));
                        createKeywordSpan(parent, keywordCandidate);
                        keywordCandidateStartIndex = -1;
                        segmentStartIndex = i;

                        //further more, if this delimiter is a special symbol, such as }, ;, I need to give a different color as well.
                        if(isSpecialSymbol) {
                            createSpecialCodeSymbolSpan(parent, char);
                            //since this symbol has been converted to a span and appended to fragment, increase segmentStartIndex by 1.
                            segmentStartIndex = i + 1;
                        }

                    } else {
                        keywordCandidateStartIndex = -1;
                        if(isSpecialSymbol) {
                            let previous = text.substring(segmentStartIndex, i);
                            parent.appendChild(document.createTextNode(previous));
                            createSpecialCodeSymbolSpan(parent, char);
                            segmentStartIndex = i + 1;
                        }
                    }
                    //since the cursor has moved on to a delimiter, change this flag to false.
                    isOnNoneDelimiter = false;
                }
            } else {
                //previously cursor was on delimiters
                if(!isDelimiter){
                    //if current one is on normal character, this is the first normal character after delimiters, and it will be the start of
                    //of the next word.
                    isOnNoneDelimiter = true;
                    keywordCandidateStartIndex = i;
                } else if(isSpecialSymbol) {
                    //if cursor currently also points to a delimiter, but other than whitespace it is a special character, then give the symbol
                    //a different color.
                    let previous = text.substring(segmentStartIndex, i);
                    parent.appendChild(document.createTextNode(previous));
                    createSpecialCodeSymbolSpan(parent, char);
                    //since all characters before i has been converted to either text node or span, set segmentStartIndex to i+1.
                    segmentStartIndex = i + 1;
                }
            }
        }

        //I only try to find words when I encounter a delimiter. say, in the above logic, "function ", when the last whitespace appears,
        //I know that may be the end of a word, and then i will find "function", but what if the entire text does not contains delimiter?
        //for instance, the entire text can be "   function". To overcome this issue, always add remaining characters and check for keyword
        //when the end of the text is reached.
        if(segmentStartIndex < text.length) {
            if(keywordCandidateStartIndex > -1) {
                let keywordCandidate = text.substring(keywordCandidateStartIndex, text.length);
                if(isKeyWord(keywordCandidate)) {
                    //if this candidate turns out to be a keyword, then i need to give it a different styles.
                    let previous = text.substring(segmentStartIndex, keywordCandidateStartIndex);
                    parent.appendChild(document.createTextNode(previous));
                    createKeywordSpan(parent, keywordCandidate);
                } else {
                    parent.appendChild(document.createTextNode(text.substring(segmentStartIndex)));
                }
            } else {
                parent.appendChild(document.createTextNode(text.substring(segmentStartIndex)));
            }
        }
    }

    function createKeywordSpan(parent: Node, keyword: string) {
        let keywordSpan = document.createElement("span");
        keywordSpan.classList.add("codeKeyword");
        keywordSpan.appendChild(document.createTextNode(keyword));
        parent.appendChild(keywordSpan);
    }

    function createSpecialCodeSymbolSpan(parent: Node, symbol: string) {
        let specialSymbolSpan = document.createElement("span");
        specialSymbolSpan.appendChild(document.createTextNode(symbol));
        specialSymbolSpan.classList.add("codeSpecialSymbol");
        parent.appendChild(specialSymbolSpan);
        if(symbol === '(') {
            //previous one may be a method name or a function name
            let prev = specialSymbolSpan.previousSibling;
            while(prev) {
                //previous word is a keyword, like `while(` or `for(`, or `if(`
                //only keyword or other special symbols are wrapped in span.
                if(prev.nodeName.toLowerCase() === "span") break;
                if(prev.nodeName.toLowerCase() === "#text") {
                    if(prev.nodeValue.trim() === "") {
                        //white space, skip it.
                        prev = prev.previousSibling;
                    } else {
                        //a normal piece of text, the text could have use have white space before it. but these whitespaces
                        //do no harm
                        let functionNameSpan = document.createElement("span");
                        functionNameSpan.classList.add("codeFunctionName");
                        functionNameSpan.appendChild(document.createTextNode(prev.nodeValue));
                        parent.replaceChild(functionNameSpan, prev);
                        break;
                    }
                }
            }
        }
    }
}



