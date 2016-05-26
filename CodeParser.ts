var wangsheng: HTMLDivElement;

namespace SyntaxHighlightNamespace {

    let keywords = ["function", "var", "let", "return", "if", "for", "while", "else"];

    function isKeyWord(text: string): boolean {
        return keywords.indexOf(text) !== -1;
    }

    let specialSymbol = ['{', '}', '.', '=', ';', '(', ')', "+", "-", "%", "/", "!"];

    export function parseCode(parent: Node, text: string) {

        let isOnNoneDelimiter = false;
        let keywordCandidateStartIndex = isOnNoneDelimiter ? 0 : -1;
        let segmentStartIndex = 0;

        for(let i = 0; i < text.length; i++) {
            let char = text[i];
            let isSpecialSymbol = specialSymbol.indexOf(char) > -1 ;
            let isWhitespace = char === ' ';
            let isDelimiter = isWhitespace || isSpecialSymbol;

            if(isOnNoneDelimiter) {
                if(isDelimiter || (i === text.length - 1 && !isDelimiter)) {
                    let keywordCandidate = text.substring(keywordCandidateStartIndex, i);
                    if(isKeyWord(keywordCandidate)) {
                        let previous = text.substring(segmentStartIndex, keywordCandidateStartIndex);
                        parent.appendChild(document.createTextNode(previous));
                        let keywordSpan = document.createElement("span");
                        keywordSpan.classList.add("codeKeyword");
                        keywordSpan.appendChild(document.createTextNode(keywordCandidate));
                        parent.appendChild(keywordSpan);
                        keywordCandidateStartIndex = -1;
                        segmentStartIndex = i;

                        if(isSpecialSymbol) {
                            createSpecialCodeSymbolSpan(parent, char);
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
                    isOnNoneDelimiter = false;
                }
            } else {
                if(!isDelimiter){
                    isOnNoneDelimiter = true;
                    keywordCandidateStartIndex = i;
                } else if(isSpecialSymbol) {
                    let previous = text.substring(segmentStartIndex, i);
                    parent.appendChild(document.createTextNode(previous));
                    createSpecialCodeSymbolSpan(parent, char);
                    segmentStartIndex = i + 1;
                }
            }
        }

        if(segmentStartIndex < text.length) {
            parent.appendChild(document.createTextNode(text.substring(segmentStartIndex)));
        }
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

    // let code = "var myFunc = function() { return 1; } document.body.appendChild(a); myFunc(a, b); ";
    // code += "for(let i = 0; i < 10; i++) { console.log(1); }";
    // let div = document.createElement("div");
    // div.style.border = "1px solid black";
    // document.body.appendChild(div);
    // wangsheng = div;
    // parse(div, code);
}



