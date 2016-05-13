/**
 * Created by wangsheng on 7/5/16.
 */
/// <reference path="Note.ts" />

namespace IndexNamespace {

    const r = 256; //extended ascii.

    class Node {
        next: Node[] = new Array(r);
        relatedNotes: number[];
    }

    class KeywordIndex {

        private root: Node;
        private numberOfKeys: number;
        constructor(){};

        public get(key: string): number[] {
            let x: Node = this.getHelper(this.root, key, 0);
            if( x === undefined ) return undefined;
            return x.relatedNotes;
        }

        private getHelper(x: Node, key: string, d: number) {
            if(x === undefined) return undefined;
            if(d === key.length) return x;
            let c:number = key.charCodeAt(d);
            return this.getHelper(x.next[c], key, d+1);
        }

        public put(key:string, noteIndex: number): void {
            this.root = this.putHelper(this.root, key, noteIndex, 0);
        }

        private putHelper(x: Node, key: string, noteIndex: number, d: number): Node {
            if(x === undefined) x = new Node();
            if(d === key.length) {
                if(x.relatedNotes === undefined) {
                    x.relatedNotes = [];
                    x.relatedNotes[noteIndex] = 1;
                    this.numberOfKeys++;
                } else {
                    x.relatedNotes[noteIndex] += 1;
                }
                return x;
            }
            let c: number = key.charCodeAt(d);
            x.next[c] = this.putHelper(x.next[c], key, noteIndex, d+1);
            return x;
        }

        public delete(key: string, noteIndex: number) {
            this.root = this.deleteHelper(this.root, key, noteIndex, 0);
        }

        private deleteHelper(x: Node, key: string, noteIndex: number, d: number) {
            if( x === undefined) return undefined;
            if( d === key.length) {
                if(x.relatedNotes !== undefined) {
                    if(x.relatedNotes[noteIndex] > 0) {
                        x.relatedNotes[noteIndex] -= 1;
                    }

                    if(x.relatedNotes[noteIndex] === 0) {
                        x.relatedNotes[noteIndex] = undefined;
                    }

                    if(x.relatedNotes.length === 0) x.relatedNotes = undefined;
                    this.numberOfKeys--;
                }
            } else {
                let c: number = key.charCodeAt(d);
                x.next[c] = this.deleteHelper(x.next[c], key, noteIndex, d+1);
            }

            if(x.relatedNotes !== undefined) return x;
            for (let c = 0; c < r; c++) {
                if(x.next[c] !== undefined) return x;
            }
            return undefined;
        }

        public size(): number {
            return this.numberOfKeys;
        }




    }
}

class Index {

    suggestKeyword(prefix:string):string[] {
        let end = getRandomInt(0, 10);
        return dummySuggestions.slice(0, end);
    }

    findNotes(keyword:string):Note[] {
        return [];
    }

    linkKeywordToNote(keyword: string, note: Note) {

    }

    unlinkKeywordFromNote(keyword: string, note: Note) {

    }

}

let index;

let dummySuggestions = ["hello", "there", "how you", "function", "switch case", "if else", "array length", "number", "linked list", "hash map"];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getIndex():Index{
    if(!index) {
        index = new Index();
        return index;
    } else {
        return index;
    }
}