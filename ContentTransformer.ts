///<reference path="typings/extended.d.ts"/>
///<reference path="Storage.ts"/>
///<reference path="AsyncUtil.ts"/>
///<reference path="ImageCanvasUtility.ts"/>
///<reference path="Tokenizor.ts"/>
///<reference path="NoteNameCache.ts"/>
///<reference path="AppEvents.ts"/>

/**
 * Inside the editor is a large dom fragment. While I can store that dom fragment in the indexeddb,
 * it is not a good idea. Dom objects are large and contains too many unneeded information.
 *
 * Instead I extract only the useful information from the dom fragment and build my own component tree.
 * Each node in the component tree is the of type `Component`. and contains at most 4 properties.
 *
 * This component tree can then be easily cloned and stored in database, or copied over to another page.
 *
 * I can rebuild an identical dom fragment based on this component tree.
 * I can also build a string out of the component tree. KeywordProcessor can later process this string to have
 * keywords indexed.
 */
namespace ContentTransformerNamespace {

    import getImageBlob = StorageNamespace.getImageBlob;
    import getIDB = StorageNamespace.getIDB;
    import createCanvasBasedOnImageData = Utility.createCanvasBasedOnImageData;
    import createImageFromBlob = Utility.createImageFromBlob;
    import getIndex = IndexNamespace.getIndex;
    import tokenize = TokenizorNamespace.tokenize;
    import getNoteName = NoteNameCacheNamespace.getNoteName;
    import broadcast = AppEventsNamespace.broadcast;
    import AppEvent = AppEventsNamespace.AppEvent;

    const textNodeName = "#text";
    const imgNodeName = "img";

    let index = getIndex();

    function isBlockLevelMarkup(text:string) {
        //in case we are looking at @header myHeader
        if (text.startsWith("@header ")) return true;
        //except for the above special case, use index.
        let r = index.get(text);
        if (r === undefined) return false;
        return r.wordType === WordType.blockLevelMarkup;
    }

    /**
     * convert the code editor to component tree. the code editor itself is transformed into a document fragment. Here I convert
     * the children of code editor to a list of components. If there are adjacent text nodes, they are normalized (merged).
     */
    export function convertToComponentFormat(codeEditor:Node):Component[] {
        let normalizedComponents:Component[] = [];
        for (let i = 0; i < codeEditor.childNodes.length; i++) {
            let node = codeEditor.childNodes[i];
            let cp:Component = {nodeName: node.nodeName.toLowerCase()};
            if (cp.nodeName === textNodeName) cp.value = node.nodeValue;
            if (cp.nodeName === imgNodeName) {
                let img = <HTMLImageElement>node;
                cp.imageDataId = img.imageDataId;
                cp.imageWidth = img.width;
                cp.imageHeight = img.height;
            }
            addChildAndNormalize(normalizedComponents, cp);
        }

        let codeLanguage:CodeLanguage;
        let noticeLevel:NoticeLevel;

        for (let i = 0; i < normalizedComponents.length; i++) {
            let cp = normalizedComponents[i];
            if (cp.nodeName !== "#text") continue;
            if (cp.value.startsWith("@") && cp.value !== "@") {
                //if the component may be a block level markup because it starts with @
                if ((normalizedComponents[i - 1] === undefined || normalizedComponents[i - 1].nodeName === "br")
                    && (normalizedComponents[i + 1] === undefined || normalizedComponents[i + 1].nodeName === "br")) {
                    //...and it is on its own line
                    //then now I am sure this is a block level markup.
                    if (isBlockLevelMarkup(cp.value)) {
                        cp.isBlockLevelMarkup = true;
                        switch (cp.value) {
                            case "@js":
                                codeLanguage = CodeLanguage.js;
                                noticeLevel = undefined;
                                break;
                            case "@java":
                                codeLanguage = CodeLanguage.java;
                                noticeLevel = undefined;
                                break;
                            case "@important":
                                codeLanguage = undefined;
                                noticeLevel = NoticeLevel.important;
                                break;
                            case "@less":
                                codeLanguage = undefined;
                                noticeLevel = NoticeLevel.less;
                                break;
                        }
                        continue;
                    }

                }
            } else if (cp.value === "@") {
                //value is '@'
                if ((normalizedComponents[i - 1] === undefined || normalizedComponents[i - 1].nodeName === "br")
                    && (normalizedComponents[i + 1] === undefined || normalizedComponents[i + 1].nodeName === "br")) {
                    //...and it is on its own line
                    //now Im sure it is a @ markup. and it ends code block or notice block anyway.
                    cp.isBlockLevelMarkup = true;
                    codeLanguage = undefined;
                    noticeLevel = undefined;
                    continue;
                }
            }

            //if not block level markup, I will go down here
            if (codeLanguage !== undefined) cp.codeLanguage = codeLanguage;
            if (noticeLevel !== undefined) cp.noticeLevel = noticeLevel;

            cp.tokens = tokenize(cp);
        }

        return normalizedComponents;
    }

    /**
     * add component to the component list. if there are adjacent text nodes, normalize them (merge them) when adding in.
     */
    export function addChildAndNormalize(result:Component[], child:Component) {
        if (result.length === 0) {
            result.push(child);
            return;
        }

        let li = result.length - 1;
        if (result[li].nodeName === textNodeName && child.nodeName === textNodeName) {
            result[li].value += child.value;
        } else {
            result.push(child);
        }
    }

    /**
     * build the dom nodes based on given component tree.
     */
    export function* convertToDocumentFragment(components:Component[]):IterableIterator<any> {
        let frag = document.createDocumentFragment();
        for (let i = 0; i < components.length; i++) {
            let cp = components[i];
            let node;
            switch (cp.nodeName) {
                case textNodeName:
                    node = document.createTextNode(cp.value);
                    break;
                case imgNodeName:
                    let idb = yield getIDB();
                    let imageDataId = cp.imageDataId;
                    let imageData = yield getImageBlob(idb, imageDataId);
                    node = yield createImageFromBlob(imageData);
                    let img = <HTMLImageElement>node;
                    img.imageDataId = imageDataId;
                    img.width = cp.imageWidth;
                    img.height = cp.imageHeight;
                    break;
                default:
                    node = document.createElement(cp.nodeName);
            }
            frag.appendChild(node);
        }
        return frag;
    }

    /**
     * converts the component list to a styled document fragment.
     */
    export function* convertToStyledDocumentFragment(components:Component[]):IterableIterator<any> {

        //create a document fragment, this will be parent of all other converted components.
        let frag = document.createDocumentFragment();
        /**
         * if i encounter @js, @java, @important, or @less, then create a div and temporarily append the converted components
         * to this div. this div is used to style the background color. that is, if you have an @important block, the entire
         * block needs to have light blue background, and i need a div to achieve that. inspect the dom elements in the browser
         * to have a better understanding.
         */
        let styledContainer:HTMLDivElement;

        //if styled container is available, append converted components to the styled container, otherwise append to document fragment.
        function getParent():Node {
            return styledContainer ? styledContainer : frag;
        }

        for (let i = 0; i < components.length; i++) {
            let cp = components[i];
            switch (cp.nodeName) {
                case textNodeName:
                    if (cp.isBlockLevelMarkup) {
                        if (cp.value.startsWith("@header ")) {
                            /**
                             * previous line text <br>
                             * @header headerText <br>  <-- this br makes sure @header is on its own line in the source code.
                             */
                            let header = document.createElement("h3");
                            let headerText = cp.value.substring(8); //header text is the portion that starts from index 8
                            header.appendChild(document.createTextNode(headerText));
                            frag.appendChild(header);
                            i++; //the br after @header is no longer necessary because h2 element automatically ends the line.
                            continue;
                        } else if (cp.value === "@line") {
                            /**
                             * previous line text <br>
                             * @line <br>  <-- this br makes sure @line is on its own line in the source code.
                             */
                            let horizontalLine = document.createElement("hr");
                            frag.appendChild(horizontalLine);
                            i++; //<hr> terminates the line itself and therefore the br next to @line is no longer necessary.
                            continue;
                        } else {
                            //the following will terminate a block: @js, @java, @important, @less and @
                            //I will use @ as an example here
                            /**
                             * two cases
                             * case one:
                             * before parse:        when parse progress to @
                             * @js                  <div class="js">
                             * <br>                     //this br is skipped when parsing @js
                             * text                     text
                             * <br>                     <br> //this br needs to be removed and it is now the last child
                             * @                        //now im processing this @
                             * <br>                     //this br will be skipped when process of @ is done.
                             *
                             * case two:
                             * before parse:        when parse progress to @
                             * @js                  <div class="js">
                             * <br>                     //this br is already skipped when parsing @js
                             * @                        //now Im processing this @
                             *
                             * notice that in case two, i no longer need to deal with the br previous to @, since this br
                             * happens to be next sibling of @js and it is already skipped. in this case, the styledContainer
                             * is empty and has no child. therefore i can test `styledContainer.lastChild` to find this out.
                             */
                            if (styledContainer && styledContainer.lastChild)
                            //in case one, remove the br. this br is the last child of styledContainer now.
                                styledContainer.removeChild(styledContainer.lastChild);
                            i++; //skip next br
                            styledContainer = undefined;
                            continue;
                        }
                    } else {
                        if (cp.codeLanguage !== undefined) {
                            if (styledContainer === undefined) {
                                styledContainer = document.createElement("div");
                                frag.appendChild(styledContainer);
                                switch (cp.codeLanguage) {
                                    case CodeLanguage.java:
                                        styledContainer.classList.add("java");
                                        break;
                                    case CodeLanguage.js:
                                        styledContainer.classList.add("js");
                                        break;
                                }
                            }
                            parseCode(getParent(), cp.tokens);

                        } else if (cp.noticeLevel !== undefined) {
                            if (styledContainer === undefined) {
                                styledContainer = document.createElement("div");
                                frag.appendChild(styledContainer);
                                switch (cp.noticeLevel) {
                                    case NoticeLevel.important:
                                        styledContainer.classList.add("important");
                                        break;
                                    case NoticeLevel.less:
                                        styledContainer.classList.add("less");
                                        break;
                                }
                            }
                            convertStyledParagraph(getParent(), cp.tokens);
                        } else {
                            convertStyledParagraph(getParent(), cp.tokens);
                        }
                    }
                    break;
                case imgNodeName:
                    //read the image data from database, and set it as the src of a new image element. when the image data is
                    //loaded, append the image to parent node.
                    let idb = yield getIDB();
                    let imageDataId = cp.imageDataId;
                    let imageData = yield getImageBlob(idb, imageDataId);
                    let img = yield createImageFromBlob(imageData);
                    img.imageDataId = imageDataId;
                    img.width = cp.imageWidth;
                    img.height = cp.imageHeight;
                    getParent().appendChild(img);
                    break;
                default:
                    getParent().appendChild(document.createElement(cp.nodeName));
            }

        }

        return frag;
    }

    /**
     * convert components to styled paragraph.
     */
    function convertStyledParagraph(parent:Node, tokens:{tokenTypes:WordType[], tokenValues:string[]}) {

        let targetMarkup:string = undefined;
        let tokenTypes:WordType[] = tokens.tokenTypes;
        let tokenValues:string[] = tokens.tokenValues;
        let buffer:string[] = [];

        for (let i = 0; i < tokenValues.length; i++) {
            let c = tokenValues[i];
            if (tokenTypes[i] === WordType.inlineLevelMarkup) {
                if (c === targetMarkup) {
                    let span = document.createElement("span");
                    switch (c) {
                        case "`":
                            span.classList.add("inlineCode");
                            break;
                        case "~":
                            span.classList.add("emphasis");
                            break;
                        case "_":
                            span.classList.add("italic");
                            break;
                        case "#":
                            span.classList.add("tag");
                            break;
                        default:
                            break;
                    }
                    parent.appendChild(span);
                    buffer.shift();
                    let spanText = buffer.join("");
                    if(c === "`" && spanText.startsWith("note-ref:") && !Number.isNaN(+(spanText.substring(9)))) {
                        let refNoteId = +(spanText.substring(9));
                        spanText = getNoteName(refNoteId);
                        span.classList.remove("inlineCode");
                        span.classList.add("inlineRef");
                        span.onclick = function(){
                            broadcast(AppEvent.viewNote, refNoteId);
                        }
                    }
                    span.appendChild(document.createTextNode(spanText));
                    buffer = [];
                    targetMarkup = undefined;
                } else {
                    parent.appendChild(document.createTextNode(buffer.join("")));
                    targetMarkup = c;
                    buffer = [c];
                }
            } else {
                buffer.push(tokenValues[i]);
            }
        }
        parent.appendChild(document.createTextNode(buffer.join("")));
    }

    function parseCode(parent:Node, tokens:{tokenTypes:WordType[], tokenValues:string[]}) {
        let tokenTypes:WordType[] = tokens.tokenTypes;
        let tokenValues:string[] = tokens.tokenValues;
        let span:HTMLSpanElement;
        for (let i = 0; i < tokenTypes.length; i++) {
            switch (tokenTypes[i]) {
                case WordType.unknownCodeWord:
                case WordType.whitespace:
                    parent.appendChild(document.createTextNode(tokenValues[i]));
                    break;
                case WordType.specialCodeSymbol:
                    span = document.createElement("span");
                    span.appendChild(document.createTextNode(tokenValues[i]));
                    span.classList.add("codeSpecialSymbol");
                    parent.appendChild(span);
                    break;
                case WordType.javaKeyword:
                case WordType.jsKeyword:
                    span = document.createElement("span");
                    span.appendChild(document.createTextNode(tokenValues[i]));
                    span.classList.add("codeKeyword");
                    parent.appendChild(span);
                    break;
                case WordType.functionName:
                    span = document.createElement("span");
                    span.appendChild(document.createTextNode(tokenValues[i]));
                    span.classList.add("codeFunctionName");
                    parent.appendChild(span);
                    break;
                case WordType.codeDoubleQuoteString:
                case WordType.codeSingleQuoteString:
                    span = document.createElement("span");
                    span.appendChild(document.createTextNode(tokenValues[i]));
                    span.classList.add("codeString");
                    parent.appendChild(span);
                    break;
                case WordType.codeComment:
                    span = document.createElement("span");
                    span.appendChild(document.createTextNode(tokenValues[i]));
                    span.classList.add("codeComment");
                    parent.appendChild(span);
                    break;
            }
        }
    }

    function findPairs(components:Component[], pairIdentifier:string) {
        let pairs:string[] = [];
        for (let ci = 0; ci < components.length; ci++) {
            if(components[ci].tokens){
                let tokenValues = components[ci].tokens.tokenValues;
                let ii = -1;
                for (let i = 0; i < tokenValues.length; i++) {
                    if (tokenValues[i] === pairIdentifier) {
                        if (ii === -1) {
                            ii = i;
                        } else {
                            let tokensInTag = tokenValues.slice(ii + 1, i);//do not need identifier
                            pairs.push(tokensInTag.join(""));
                            ii = -1;
                        }
                    }
                }
            }

        }
        return pairs;
    }

    export function findTags(components:Component[]) {
        return findPairs(components, "#");
    }

    export function findReferences(components:Component[]): number[] {
        return findPairs(components, "`")
            .filter(function (e:string) {
                return e.startsWith("note-ref:") && !Number.isNaN(+(e.substring(9)));
            }).map(function (e:string): number {
                return +(e.substring(9));
            })
    }
}