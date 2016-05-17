/// <reference path="Note.ts" />
/// <reference path="StopWords.ts" />

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

    class Node {
        naturalOrderCount = 0;
        reversedOrderCount = 0;
        next: Node[] = new Array(r);
        numberOfRelatedNotes = 0;
        relatedNotes: number[];
        isStopWord = false;
    }

    class KeywordIndex {

        private root: Node;
        constructor(){};

        /**
         * get the related notes linked to a key.
         * if the key does not exists, it will return undefined.
         * if the key happens to be a stop word, it will return false.
         * if the key exists and is linked to some notes, the notes will be returned.
         */
        public get(key: string): number[] | boolean {
            key = key.toLowerCase();
            let x: Node = this.getHelper(this.root, key, 0);
            if( x === undefined ) return undefined;
            if(x.isStopWord) {
                return false;
            } else {
                return x.relatedNotes;
            }
        }

        /**
         * checks if a key is a stop word.
         * if the key is not found, undefined is returned.
         * if the key is a stop word, true is returned.
         * if the key is not a stop word, false is returned.
         */
        public isStopWord(key: string): boolean {
            key = key.toLowerCase();
            let x: Node = this.getHelper(this.root, key, 0);
            if( x === undefined ) return undefined;
            return x.isStopWord;
        }

        private getHelper(x: Node, key: string, d: number) {
            if(x === undefined) return undefined;
            if(d === key.length) return x;
            let c:number = key.charCodeAt(d);
            return this.getHelper(x.next[c], key, d+1);
        }

        public put(key:string, reversed: boolean, noteIndex: number): void {
            key = key.toLowerCase();
            this.root = this.putHelper(this.root, key, reversed, noteIndex, 0);
        }

        public putAsStopWords(key: string): void {
            key = key.toLowerCase();
            this.root = this.putHelper(this.root, key, false, -1, 0);
        }

        //if note index is -1 then this key is regarded as a stop word
        private putHelper(x: Node, key: string, reversed: boolean,  noteIndex: number, d: number): Node {
            if(x === undefined) x = new Node();
            if(d === key.length) {
                if(noteIndex === -1) {
                    x.isStopWord = true;
                } else {
                    if(x.relatedNotes === undefined) {
                        //if the array is not there, create it.
                        x.relatedNotes = [];
                        //set the corresponding frequency to 1.
                        x.relatedNotes[noteIndex] = 1;
                        //here i relate one note to this key word.
                        x.numberOfRelatedNotes++;
                    } else {
                        //the array exists, but many of its slots could be undefined, rather than a number
                        if(x.relatedNotes[noteIndex] === undefined) {
                            //if the corresponding frequency is undefined, initialize it to 1.
                            x.relatedNotes[noteIndex] = 1;
                            //one more note is related to this keyword
                            x.numberOfRelatedNotes++;
                        } else {
                            //well, its already a number, increment it then.
                            x.relatedNotes[noteIndex] += 1;
                        }
                    }

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
                x.next[c] = this.putHelper(x.next[c], key, reversed, noteIndex, d+1);
            return x;
        }

        public remove(key: string, reversed: boolean, noteIndex: number) {
            key = key.toLowerCase();
            this.root = this.deleteHelper(this.root, key, reversed, noteIndex, 0);
        }

        private deleteHelper(x: Node, key: string, reversed: boolean,  noteIndex: number, d: number) {
            if( x === undefined) return undefined;
            if( d === key.length) {
                if(x.relatedNotes !== undefined) {
                    if(x.relatedNotes[noteIndex] > 0) {
                        //if frequency is a number and it is greater than 0, decrement it
                        x.relatedNotes[noteIndex] -= 1;
                    }
                    if(x.relatedNotes[noteIndex] === 0) {
                        //if the frequency is reduced to 0, then the note is no longer related to the key
                        x.relatedNotes[noteIndex] = undefined;
                        x.numberOfRelatedNotes--;
                    }
                    if(reversed) {
                        x.reversedOrderCount--;
                    } else {
                        x.naturalOrderCount--;
                    }
                    if(x.numberOfRelatedNotes === 0) {
                        //if no notes are related to this keyword, remove the array to save memory
                        x.relatedNotes = undefined;
                    }
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
            for(var stopWord of StopWordsNamespace.stopWords)
                keywordIndex.putAsStopWords(stopWord);
            return keywordIndex;
        } else {
            return keywordIndex;
        }
    }
}

