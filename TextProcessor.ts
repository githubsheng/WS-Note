///<reference path="Index.ts" />
///<reference path="ContentTransformer.ts"/>

namespace IndexNamespace {

    import Component = ContentTransformerNamespace.Component;
    /**
     * This keyword processor processes the text of a note and returns keywords, and keyword combination that needs to be indexed.
     * Text is split into words by delimiters. Most commonly seen delimiter is whitespace. For instance, "wang sheng" is split into
     * two words: "wang" and "sheng" by the whitespace in the middle. `delimiterCodes` includes all the delimiters.
     *
     * The processor not only turns words that needs to be indexed, but also word combination. It tries to come up with a combination
     * using two adjacent words. For example, "singly linked list" is first split into three words by whitespace delimiter: "singly",
     * "linked" and "list". Processor first returns "singly", and it tries to come up with a combination using "singly" and the word
     * before it. Since in this example there is no word before "singly", the processor moves on and use "singly" and the word after
     * it, it then returns "singly linked". It continue to return "linked", and then tries to come up with combinations using words
     * before "linked" and after "linked", in this case it returns "linked singly" and "linked list". Notice that when it return
     * "linked singly", it mark this keyword as `reversed`.
     *
     * The processor will not build a combination if either word is `undefined`. For example, `undefined`, "linked" and "list", will
     * result in "linked", "linked list", "list" and "list linked" only. `undefined` cannot be used to build a combination.
     *
     * Among the delimiters, there are a small subset of it that stop the processor from building word combinations. This subset is
     * `wordCombinationStoppingDelimiters`. "," for instance is a combination stopping delimiter. "a, b c" are split into "a", "b" and "c".
     * But because there is "," between "a" and "b" in the original text, "a" and "b" cannot be used to build combination "a b" or "b a".
     *
     * Combination stopping delimiters do the job by not only serve as a delimiter, but also pretend to be a word. Therefore
     * internally "a, b c" is split into ("a" "," "b" "c"). Notice that another delimiter whitespace only serve as delimiter and is not seen
     * as a word. Stopping delimiters are then transformed into `undefined`: ("a" `undefined` "b" "c"). Because "a" and "b" are
     * now not adjacent anymore, they cannot be used to build a combination together. And also because "," is transformed into
     * `undefined`, it won't be used to build combination either.
     *
     * Some words are so commonly seen that we don't want to index them. An example is "is". This word is likely to be seen in all notes
     * and is pointless as a keyword in search. These words are stored in `wordsToIgnore`. They are transformed into `undefined`
     * so that they themselves won't be indexed, and won't be used to build word combinations with adjacent keywords.
     *
     * You use `hasNext` method to check if there are more words, and call `nextWordCombination` to get current word, the combination of
     * current word and previous word, and the combination of current word and next word.
     */
    export class KeywordProcessor {
        private text:string;
        private components:Component[];
        private componentIndex = 0;
        private lastTextComponentIndex:number;
        private previousWord:string;
        private currentWord:string;
        private nextWord:string;
        private delimiterCodes:boolean[] = [];
        private wordCombinationStoppingDelimiters:boolean[] = [];
        private readIndex = -1;
        private static r = 256; //extended ascii

        constructor(components:Component[]) {
            this.components = components;
            for (let i = components.length - 1; i > 0; i--) {
                if (components[i].nodeName === "#text") {
                    this.lastTextComponentIndex = i;
                    break;
                }
            }

            this.delimiterCodes = new Array(KeywordProcessor.r);

            let delimiters = [' ', ',', '.', '`', '_', '~', ':', '-', '\n'];
            for (let i = 0; i < delimiters.length; i++) {
                let cc = delimiters[i].charCodeAt(0);
                if (cc < KeywordProcessor.r) {
                    this.delimiterCodes[cc] = true;
                }
            }

            let wordCombinationStoppingDelimiters = [',', '.', ":", '\n'];
            for (let i = 0; i < wordCombinationStoppingDelimiters.length; i++) {
                let cc = wordCombinationStoppingDelimiters[i].charCodeAt(0);
                if (cc < KeywordProcessor.r) {
                    this.wordCombinationStoppingDelimiters[cc] = true;
                }
            }

            //init, prev: undefined, cur: undefined, next: first word. so that when `nextWordCombination` gets called for the
            //first time, prev will be undefined, cur will be first word and next will be second word.
            this.nextWord = this.nextWordHelper();
        }

        private setText(text:string) {
            this.readIndex = 0;
            this.text = text;
        }

        private findNextTextComponent():string {
            while (this.componentIndex <= this.lastTextComponentIndex) {
                let comp = this.components[this.componentIndex];
                if (comp.nodeName === "#text") {
                    this.componentIndex++;
                    return comp.value;
                } else {
                    this.componentIndex++;
                }
            }
        }

        private isCharAtIndexDelimeter():boolean {
            let cc = this.text.charCodeAt(this.readIndex);
            return this.delimiterCodes[cc] === true;
        }

        private isCharAtIndexCombinationStoppingDelimiter():boolean {
            let cc = this.text.charCodeAt(this.readIndex);
            return this.wordCombinationStoppingDelimiters[cc] === true;
        }

        private nextWordHelper():string {

            if (this.readIndex === -1) {
                let r = this.findNextTextComponent();
                this.setText(r)
            }

            while (this.isCharAtIndexDelimeter() && this.readIndex < this.text.length) {
                if (this.isCharAtIndexCombinationStoppingDelimiter()) {
                    this.readIndex++;
                    return undefined;
                } else {
                    this.readIndex++;
                }
            }


            let wordStartIndex = this.readIndex;

            while (!this.isCharAtIndexDelimeter() && this.readIndex < this.text.length)
                this.readIndex++;

            let wordEndIndex = this.readIndex;

            if (wordStartIndex === wordEndIndex) {
                //no more words
                this.readIndex = -1; //use this as the flag
                return undefined;
            } else {
                let result = this.text.substring(wordStartIndex, wordEndIndex);
                if (IndexNamespace.getIndex().isStopWord(result)) return undefined;
                return result;
            }

        }

        public hasNext():boolean {
            return this.readIndex !== -1 || this.componentIndex <= this.lastTextComponentIndex;
        }

        //"there are many types of lists, singly linked list, doubly linked list, and array list"
        public nextWordCombination():{prevComb:string, cur:string, nextComb:string} {
            this.previousWord = this.currentWord;
            this.currentWord = this.nextWord;
            //if `nextWordHelper` cannot find next word, it will set `readIndex` to -1, indicating the `currentWord` is already
            //the last word. `hasNext` will then return false.
            this.nextWord = this.nextWordHelper();

            if (this.currentWord === undefined && this.readIndex !== -1)
                return this.nextWordCombination();

            return {
                prevComb: this.previousWord === undefined || this.currentWord === undefined ?
                    undefined : this.currentWord + " " + this.previousWord,
                cur: this.currentWord,
                nextComb: this.nextWord === undefined || this.currentWord === undefined ?
                    undefined : this.currentWord + " " + this.nextWord
            };
        }

    }
}

