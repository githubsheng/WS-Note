///<reference path="Index.ts"/>
///<reference path="CommonModels.ts" />

namespace SyntaxHighlightNamespace {

    let specialSymbol = ['{', '}', '.', ',', '=', ';', '(', ')', "+", "-", "%", "/", "!"];

    let index = IndexNamespace.getIndex();

    export enum Language {
        js, java
    }

    function isCodeKeyword(word:string, language:Language):boolean {
        let r = index.get(word);
        if (r === undefined) return false;
        if (language === Language.js) return r.wordType === WordType.jsKeyword;
        if (language === Language.java) return r.wordType === WordType.javaKeyword;
    }

    export function parseCode(parent:Node, text:string, language:Language) {

        /**
         * delimiters include whitespace, and special code symbols such as ; { } ( ) and so on.
         * isOnNormalCharacter indicates whether the cursor in the following for-loop is on a normal character, or on a delimiter.
         */
        let isOnNormalCharacter = false;
        /**
         *  _means whitespace
         *  segmentStartIndex: index of first character that has not been converted to a text node or a span.
         *  |
         *  |
         *  _______function foo() {};
         *         |
         *      keywordCandidateStartIndex
         */
        let keywordCandidateStartIndex = -1;
        let segmentStartIndex = 0;

        let isOnDoubleQuoteStringMode = false;
        let isOnSingleQuoteStringMode = false;
        let stringSpan:HTMLSpanElement; //all characters inside a code string will be added into this span.

        for (let i = 0; i < text.length; i++) {
            let char = text[i];
            let isSpecialSymbol = specialSymbol.indexOf(char) > -1;
            let isWhitespace = char === ' ';
            let isDoubleQuote = char === '\"';
            let isSingleQuote = char === '\'';
            let isDelimiter = isWhitespace || isSpecialSymbol || isDoubleQuote || isSingleQuote;

            /*
             * char is part of a code string.
             * for example:
             * console.log("hello world");
             *                  |
             *              current char is part of the code string "hello world"
             */
            if(isOnDoubleQuoteStringMode || isOnSingleQuoteStringMode) {
                //here if isOnDoubleQuoteStringMode or isOnSingleQuoteStringMode is true then stringSpan cannot be undefined.
                //I am adding the if condition to make my ide and compiler happy.
                if(stringSpan) stringSpan.firstChild.nodeValue += char;
                if(isDoubleQuote && isOnDoubleQuoteStringMode) {
                    //if we are seeing a double quote string and the current character is a double quote, it means the end of the
                    //code string.
                    isOnDoubleQuoteStringMode = false;
                    isOnNormalCharacter = false;
                } else if(isSingleQuote && isOnSingleQuoteStringMode) {
                    isOnSingleQuoteStringMode = false;
                    isOnNormalCharacter = false;
                }
                //since char at index i has been converted to a text node / span by `stringSpan.firstChild.nodeValue += char` above,
                //the index of first unconverted character would be i + 1
                segmentStartIndex = i + 1;
                continue;
            }

            if (isOnNormalCharacter) {
                //if previously I am looking at normal characters, and now for the first time I am looking at delimiters,
                //then I have found a word.
                /**
                 * keywordCandidateStartIndex
                 * |
                 * function   <---before cursor is on delimiter it was `isOnNormalCharacter`
                 *         |
                 *      white space delimiter / cursor position
                 */
                if (isDelimiter) {
                    //from the above comments you can see the founded word is text.substring(keywordCandidateStartIndex, i)
                    let keywordCandidate = text.substring(keywordCandidateStartIndex, i);
                    if (isCodeKeyword(keywordCandidate, language)) {
                        //if this candidate turns out to be a keyword, then i need to give it a different styles.
                        let previous = text.substring(segmentStartIndex, keywordCandidateStartIndex);
                        parent.appendChild(document.createTextNode(previous));
                        createKeywordSpan(parent, keywordCandidate);
                        keywordCandidateStartIndex = -1;
                        segmentStartIndex = i;
                    } else {
                        keywordCandidateStartIndex = -1;
                        let previous = text.substring(segmentStartIndex, i);
                        parent.appendChild(document.createTextNode(previous));
                        segmentStartIndex = i;
                    }

                    //further more, if this delimiter is a special symbol, such as }, ;, I need to give a different color as well.
                    if (isSpecialSymbol) {
                        createSpecialCodeSymbolSpan(parent, char);
                        //since this symbol has been converted to a span and appended to fragment, segmentStartIndex should be i + 1
                        segmentStartIndex = i + 1;
                    } else if(isDoubleQuote || isSingleQuote) {
                        if(isDoubleQuote) isOnDoubleQuoteStringMode = true;
                        if(isSingleQuote) isOnSingleQuoteStringMode = true;
                        stringSpan = createStringSpan(parent, char);
                        segmentStartIndex = i + 1;
                    }
                    //since the cursor has moved on to a delimiter, change this flag to false.
                    isOnNormalCharacter = false;
                }
            } else {

                if (isSpecialSymbol || isDoubleQuote || isSingleQuote) {
                    //if current character is of the three types above, I need to give the current character a different color
                    //first convert the previous delimiters to a normal text node and append the text node to parent.
                    let previous = text.substring(segmentStartIndex, i);
                    parent.appendChild(document.createTextNode(previous));

                    //then create a span for the current delimiter and then append the span to parent as well.
                    //I will also give a class name to the span so that it gets a different color.
                    if (isSpecialSymbol) {
                        createSpecialCodeSymbolSpan(parent, char);
                    } else if (isDoubleQuote || isSingleQuote) {
                        if(isDoubleQuote) isOnDoubleQuoteStringMode = true;
                        if(isSingleQuote) isOnSingleQuoteStringMode = true;
                        stringSpan = createStringSpan(parent, char);
                    }

                    //since all characters before i has been converted to text node and character at i itself is converted to a span,
                    //set segmentStartIndex to i+1.
                    segmentStartIndex = i + 1;
                } else if (!isDelimiter) {
                    //if current one is on normal character, this is the first normal character after delimiters, and it will be the start of
                    //of the next word.
                    isOnNormalCharacter = true;
                    //if later there would be a word, the word will definitely start from current character.
                    keywordCandidateStartIndex = i;
                }
            }
        }

        //I only try to find words when I encounter a delimiter. say, in the above logic, "function ", when the last whitespace appears,
        //I know that may be the end of a word, and then i will find "function", but what if the entire text does not contains delimiter?
        //for instance, the entire text can be "   function". To overcome this issue, always add remaining characters and check for keyword
        //when the end of the text is reached.
        if (segmentStartIndex < text.length) {
            if (keywordCandidateStartIndex > -1) {
                let keywordCandidate = text.substring(keywordCandidateStartIndex, text.length);
                if (isCodeKeyword(keywordCandidate, language)) {
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

    function createKeywordSpan(parent:Node, keyword:string) {
        let keywordSpan = document.createElement("span");
        keywordSpan.classList.add("codeKeyword");
        keywordSpan.appendChild(document.createTextNode(keyword));
        parent.appendChild(keywordSpan);
    }

    function createSpecialCodeSymbolSpan(parent:Node, symbol:string) {
        let specialSymbolSpan = document.createElement("span");
        specialSymbolSpan.appendChild(document.createTextNode(symbol));
        specialSymbolSpan.classList.add("codeSpecialSymbol");
        parent.appendChild(specialSymbolSpan);
        if (symbol === '(') {
            //previous one may be a method name or a function name
            let prev = specialSymbolSpan.previousSibling;
            while (prev) {
                //previous word is a keyword, like `while(` or `for(`, or `if(`
                //only keyword or other special symbols are wrapped in span.
                if (prev.nodeName.toLowerCase() === "span") break;
                if (prev.nodeName.toLowerCase() === "#text") {
                    if (prev.nodeValue.trim() === "") {
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

    function createStringSpan(parent: Node, quote: string) {
        let stringSpan = document.createElement("span");
        stringSpan.classList.add("codeString");
        parent.appendChild(stringSpan);
        stringSpan.appendChild(document.createTextNode(quote));
        return stringSpan;
    }
}



