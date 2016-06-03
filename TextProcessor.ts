///<reference path="CommonModels.ts" />
///<reference path="Index.ts"/>

namespace IndexNamespace {
    /**
     * This keyword processor processes the text of a note and returns keywords, and keyword combination that needs to be indexed.
     * Text is split into words by delimiters. Most commonly seen delimiter is whitespace. For instance, "wang sheng" is split into
     * two words: "wang" and "sheng" by the whitespace in the middle. `delimiterCodes` includes all the delimiters.
     *
     * The processor not only turns words that needs to be indexed, but also word combination. It tries to come up with a combination
     * using two adjacent words if and only if both words' word type is WordType.word.
     *
     * For example, "singly linked list" will result in[singly], [linked], [singly linked], [linked singly], [list], [list linked], [linked list],
     * Notice that when it return [linked singly] and [list linked], it mark these keywords as `reversed`.
     *
     * Some words are so commonly seen that we don't want to index them. An example is "is". This word is likely to be seen in all notes
     * and is pointless as a keyword in search. These words have word type of WordType.stopWord
     *
     * You use `hasNext` method to check if there are more words / words combination to index.
     */
    export class KeywordProcessor {

        private components:Component[];

        constructor(components:Component[]) {
            this.components = components;
        }

        public getKeyWords(): [string, boolean][]{
            let r: [string, boolean][] = [];
            for(let i = 0; i < this.components.length; i++) {
                let cp = this.components[i];
                if(cp.tokens && cp.codeLanguage === undefined) {
                    let tokenTypes = cp.tokens.tokenTypes;
                    let tokenValues = cp.tokens.tokenValues;
                    for(let ii = 0; ii < tokenTypes.length; ii++) {
                        if(tokenTypes[ii] === WordType.word) {
                            r.push([tokenValues[ii], false]);
                            if(tokenTypes[ii - 1] === WordType.whitespace && tokenTypes[ii - 2] === WordType.word) {
                                r.push([tokenValues[ii - 2] + " " + tokenValues[ii], false]);
                                r.push([tokenValues[ii] + " " + tokenValues[ii - 2], true]);
                            }
                        }
                    }
                }
            }
            return r;
        }
    }
}

