/// <reference path="Note.ts" />
/// <reference path="SpecialWords.ts" />

namespace IndexNamespace {

    const r = 256; //extended ascii.

    function swap(array: any[], i: number, j: number) {
        let ie = array[i];
        array[i] = array[j];
        array[j] = ie;
    }

    function reverse(array: any[], s: number, e: number) {
        while (s < e) {
            swap(array, s, e);
            s++;
            e--;
        }
    }

    export enum WordType {
        searchKeyword, normalStopWords, markup, jsKeyword, javaKeyword
    }

    class Node {
        naturalOrderCount = 0;
        reversedOrderCount = 0;
        next: Node[] = new Array(r);
        relatedNotes: Map<number, number>;
        wordType: WordType;
    }

    class KeywordIndex {

        private root: Node;
        constructor(){};

        public get(key: string): {wordType: WordType, relatedNotes: Map<number, number>} {
            key = key.toLowerCase();
            let x: Node = this.getHelper(this.root, key, 0);
            if(x === undefined || x.wordType === undefined) return undefined;
            return {wordType: x.wordType, relatedNotes: x.relatedNotes};
        }

        /**
         * checks if a key should be ignored when building search key index.
         * if the key is not found, undefined is returned.
         * if the key is a ignorable word, true is returned.
         * if the key is not a ignorable word, false is returned.
         */
        public isIgnorable(key: string): boolean {
            key = key.toLowerCase();
            let x: Node = this.getHelper(this.root, key, 0);
            if( x === undefined || x.wordType === undefined ) return undefined;
            return x.wordType !== WordType.searchKeyword; //all other types, should be ignored when building search key index.
        }

        private getHelper(x: Node, key: string, d: number) {
            if(x === undefined) return undefined;
            if(d === key.length) return x;
            let c:number = key.charCodeAt(d);
            return this.getHelper(x.next[c], key, d+1);
        }

        public putAsSearchKeyword(key:string, reversed: boolean, noteIndex: number): void {
            key = key.toLowerCase();
            this.root = this.putHelper(this.root, key, reversed, WordType.searchKeyword, noteIndex, 0);
        }

        private putAsNoneSearchKeyword(key: string, wordType: WordType) {
            key = key.toLowerCase();
            this.root = this.putHelper(this.root, key, false, wordType, -1, 0);
        }

        public putAsNormalStopWord(key: string): void {
            this.putAsNoneSearchKeyword(key, WordType.normalStopWords);
        }

        public putAsMarkup(key: string): void {
            this.putAsNoneSearchKeyword(key, WordType.markup);
        }

        public putAsJsKeyword(key: string): void {
            this.putAsNoneSearchKeyword(key, WordType.jsKeyword);
        }

        //if note index is -1 then this key is regarded as a stop word
        private putHelper(x: Node, key: string, reversed: boolean, wordType: WordType, noteIndex: number, d: number): Node {
            if(x === undefined) x = new Node();
            if(d === key.length) {
                x.wordType = wordType;
                if(wordType === WordType.searchKeyword) {
                    if(x.relatedNotes === undefined) x.relatedNotes = new Map();
                    let frequency = x.relatedNotes.get(noteIndex);
                    let newFrequency = frequency === undefined ? 1 : frequency + 1;
                    x.relatedNotes.set(noteIndex, newFrequency);
                    if(reversed) {
                        x.reversedOrderCount++;
                    } else {
                        x.naturalOrderCount++;
                    }
                }
                return x;
            }
            let c: number = key.charCodeAt(d);
            //only index english for now, if a character is not in ascii extended, do not continue.
            if(c < r)
                x.next[c] = this.putHelper(x.next[c], key, reversed, wordType, noteIndex, d+1);
            return x;
        }

        public remove(key: string, reversed: boolean, noteIndex: number) {
            key = key.toLowerCase();
            this.root = this.deleteHelper(this.root, key, reversed, noteIndex, 0);
        }

        private deleteHelper(x: Node, key: string, reversed: boolean, noteIndex: number, d: number) {
            if( x === undefined) return undefined;
            if( d === key.length) {
                if(x.relatedNotes !== undefined) {
                    let frequency = x.relatedNotes.get(noteIndex);
                    if(frequency !== undefined) {
                        if(frequency === 1) x.relatedNotes.delete(noteIndex);
                        if(frequency > 1) x.relatedNotes.set(noteIndex, frequency - 1);
                        if(reversed) {
                            x.reversedOrderCount--;
                        } else {
                            x.naturalOrderCount--;
                        }
                    }

                    if(x.relatedNotes.size === 0) x.relatedNotes = undefined;
                }
            } else {
                let c: number = key.charCodeAt(d);
                x.next[c] = this.deleteHelper(x.next[c], key, reversed, noteIndex, d+1);
            }

            if(x.relatedNotes !== undefined) return x;
            for (let c = 0; c < r; c++) {
                if(x.next[c] !== undefined) return x;
            }
            return undefined;
        }

        public keysWithPrefix(prefix: string): string[] {
            prefix = prefix.toLowerCase();
            let results: string[] = [];
            let x = this.getHelper(this.root, prefix, 0);
            this.collect(x, prefix.split(""), results);
            return results;
        }

        private collect(x: Node, prefix: string[], results: string[]): void {
            if(x === undefined) return;
            if(x.relatedNotes !== undefined) {

                if(x.reversedOrderCount > 0) {
                    let p = prefix.slice();
                    p.reverse();
                    let indexOfSpace = p.indexOf(' ');
                    reverse(p, 0, indexOfSpace - 1);
                    reverse(p, indexOfSpace + 1, p.length - 1);
                    let r = p.join("");
                    results.push(r);
                }

                if(x.naturalOrderCount > 0) {
                    let r = prefix.join("");
                    results.push(r);
                }

            }
            for(let c = 0; c < r; c++) {
                prefix.push(String.fromCharCode(c));
                this.collect(x.next[c], prefix, results);
                prefix.pop();
            }
        }

    }

    let keywordIndex: KeywordIndex;

    export function getIndex():KeywordIndex{
        if(!keywordIndex) {
            keywordIndex = new KeywordIndex();
            for(let normalStopWord of SpecialWordsNamespace.normalStopWords)
                keywordIndex.putAsNormalStopWord(normalStopWord);
            for(let markup of SpecialWordsNamespace.markups)
                keywordIndex.putAsMarkup(markup);
            for(let jsKeyword of SpecialWordsNamespace.jsKeywords)
                keywordIndex.putAsJsKeyword(jsKeyword);
            return keywordIndex;
        } else {
            return keywordIndex;
        }
    }
}

