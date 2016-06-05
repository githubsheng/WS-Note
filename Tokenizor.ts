///<reference path="CommonModels.ts"/>
///<reference path="Index.ts"/>

namespace TokenizorNamespace {
    import getIndex = IndexNamespace.getIndex;

    let index = getIndex();

    export function tokenize(component: Component): {tokenValues: string[], tokenTypes: WordType[]} {
        if(component.nodeName !== "#text") return undefined;
        if(component.isBlockLevelMarkup) return undefined;

        if(component.codeLanguage !== undefined) {
            return tokenizeCode(component.value, component.codeLanguage);
        } else {
            return tokenizeParagraph(component.value);
        }
    }

    function isazAZ(cc: number){
        return (cc >= 97 && cc <= 122) || (cc >= 65 && cc <= 90);
    }

    function isNumber(cc: number){
        return cc >= 48 && cc <= 57;
    }

    function isWhiteSpace(cc: number) {
        return cc === 32;
    }

    function isInlineLevelMarkup(cc: number) {
        return cc === 95 || cc === 96 || cc === 126 || cc === 35;
    }

    function getParagraphCharType(char: string): WordType {
        let cc = char.charCodeAt(0);
        if(isazAZ(cc) || isNumber(cc)) return WordType.word;
        if(isWhiteSpace(cc)) return WordType.whitespace;
        if(isInlineLevelMarkup(cc)) return WordType.inlineLevelMarkup;
        return WordType.unknownDelimiter;
    }

    function detectStopWord(token: string, tokenType: WordType): boolean {
        if(tokenType === WordType.word) {
            let r = index.get(token);
            if(r === undefined) return false;
            return r.wordType === WordType.stopWord;
        }
    }

    function tokenizeParagraph(paragraph: string): {tokenValues: string[], tokenTypes: WordType[]}{
        if(paragraph.length === 0) return {tokenValues: [], tokenTypes: []};
        let token = paragraph[0];
        let tokenType = getParagraphCharType(paragraph[0]);
        let tokenValues: string[] = [];
        let tokenTypes: WordType[] = [];
        for(let i = 1; i < paragraph.length; i++) {
            let char = paragraph[i];
            let charType = getParagraphCharType(char);

            if((charType === WordType.word || charType === WordType.whitespace)
                && (tokenType === charType)) {
                token += char;
            } else {
                tokenType = detectStopWord(token, tokenType) ? WordType.stopWord : tokenType;
                tokenValues.push(token);
                tokenTypes.push(tokenType);
                token = char;
                tokenType = charType;
            }
        }
        //last token
        tokenValues.push(token);
        tokenTypes.push(tokenType);

        return {
            tokenValues: tokenValues,
            tokenTypes: tokenTypes
        }
    }

    function isCodeKeyword(word:string, language:CodeLanguage):boolean {
        let r = index.get(word);
        if (r === undefined) return false;
        if (language === CodeLanguage.js) return r.wordType === WordType.jsKeyword;
        if (language === CodeLanguage.java) return r.wordType === WordType.javaKeyword;
    }

    function isSpecialCodeSymbol(char: string):boolean {
        let r = index.get(char);
        if (r === undefined) return false;
        return r.wordType === WordType.specialCodeSymbol;
    }

    function getCodeCharType(char: string): WordType {
        if(char === undefined) {
            console.log(1);
        }
        let cc = char.charCodeAt(0);
        if(isWhiteSpace(cc)) return WordType.whitespace;
        if(isSpecialCodeSymbol(char)) return WordType.specialCodeSymbol;
        if(char === '\"') return WordType.codeDoubleQuoteString;
        if(char === '\'') return WordType.codeSingleQuoteString;
        return WordType.unknownCodeWord;
    }

    function detectCodeKeyWord(token: string, tokenType: WordType, language:CodeLanguage): WordType {
        if(tokenType === WordType.unknownCodeWord) {
            if(isCodeKeyword(token, language)) {
                if(language === CodeLanguage.java) return WordType.javaKeyword;
                if(language === CodeLanguage.js) return WordType.jsKeyword;
            }
        }
        return tokenType;
    }


    function tokenizeCode(code: string, language:CodeLanguage): {tokenValues: string[], tokenTypes: WordType[]}{
        if(code.length === 0) return {tokenValues: [], tokenTypes: []};
        let token = code[0];
        let tokenType = getCodeCharType(code[0]);
        let tokenValues: string[] = [];
        let tokenTypes: WordType[] = [];
        let isReadingStringDoubleQuote = tokenType === WordType.codeDoubleQuoteString;
        let isReadingStringSingleQuote = tokenType === WordType.codeSingleQuoteString;
        for(let i = 1; i < code.length; i++) {
            let char = code[i];

            if(isReadingStringDoubleQuote) {
                if(char === '\"') isReadingStringDoubleQuote = false;
                token += char;
                continue;
            } else if(isReadingStringSingleQuote) {
                if(char === '\'') isReadingStringSingleQuote = false;
                token += char;
                continue;
            }

            let charType = getCodeCharType(char);
            if((charType === WordType.unknownCodeWord || charType === WordType.whitespace)
                && (tokenType === charType)) {
                token += char;
            } else {
                tokenType = detectCodeKeyWord(token, tokenType, language);
                tokenValues.push(token);
                tokenTypes.push(tokenType);
                token = char;
                tokenType = charType;
                if(tokenType === WordType.codeDoubleQuoteString) isReadingStringDoubleQuote = true;
                if(tokenType === WordType.codeSingleQuoteString) isReadingStringSingleQuote = true;

                /*special handling, back trace to find the function name if encounter a left bracket*/
                if(char === '(') {
                    for(let ii = tokenTypes.length - 1; ii > 0; ii--) {
                        if(tokenTypes[ii] === WordType.unknownCodeWord) {
                            tokenTypes[ii] = WordType.functionName;
                            break;
                        }
                    }
                }
            }
        }
        //last token
        tokenType = detectCodeKeyWord(token, tokenType, language);
        tokenValues.push(token);
        tokenTypes.push(tokenType);

        return {
            tokenValues: tokenValues,
            tokenTypes: tokenTypes
        }
    }
}