/**
 * if the component represents a text node, then the text is value.
 * if the component represents a canvas, then the imageDataId is the id of the corresponding image blob stored in db.
 * if the component represents a div, or other types that may have children, then the components that represents the
 * children are stored in children property.
 */
interface Component {
    nodeName:string;
    value?:string;
    imageDataId?:number;
    isBlockLevelMarkup?:boolean;
    codeLanguage?:CodeLanguage;
    noticeLevel?:NoticeLevel;
    tokens?: {tokenValues: string[], tokenTypes: WordType[]};
}

enum CodeLanguage {
    js, java
}

enum NoticeLevel {
    important, less
}

enum WordType {
    word, stopWord, whitespace, blockLevelMarkup, inlineLevelMarkup, unknownDelimiter,
    specialCodeSymbol, functionName, codeSingleQuoteString, codeDoubleQuoteString, jsKeyword, javaKeyword, unknownCodeWord
}

class Note {

    public id:number;
    public title: string;
    public content: string;
    public createdWhen: number;
    public modifiedWhen: number;
    public tags: string[] = [];
    public references: number[] = [];
    public components: Component[] = [];

    constructor(createdWhen: number, modifiedWhen: number) {
        this.createdWhen = createdWhen;
        this.modifiedWhen = modifiedWhen;
    }

}