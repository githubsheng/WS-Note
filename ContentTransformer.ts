///<reference path="typings/extended.d.ts"/>
///<reference path="Storage.ts"/>
///<reference path="AsyncUtil.ts"/>
///<reference path="ImageCanvasUtility.ts"/>
///<reference path="CodeParser.ts"/>

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
    import parseCode = SyntaxHighlightNamespace.parseCode;

    const textNodeName = "#text";
    const imgNodeName = "img";

    /**
     * if the component represents a text node, then the text is value.
     * if the component represents a canvas, then the imageDataId is the id of the corresponding image blob stored in db.
     * if the component represents a div, or other types that may have children, then the components that represents the
     * children are stored in children property.
     */
    export interface Component {
        nodeName:string;
        value?:string;
        imageDataId?:number;
    }

    /**
     * convert the code editor to component tree. the code editor itself is transformed into a document fragment. Here I convert
     * the children of code editor to a list of components. If there are adjacent text nodes, they are normalized (merged).
     */
    export function convertToComponentFormat(codeEditor:Node):Component[] {
        let result = [];
        for (let i = 0; i < codeEditor.childNodes.length; i++) {
            let node = codeEditor.childNodes[i];
            let cp:Component = {nodeName: node.nodeName.toLowerCase()};
            if (cp.nodeName === textNodeName) cp.value = node.nodeValue;
            if (cp.nodeName === imgNodeName) cp.imageDataId = (<HTMLImageElement>node).imageDataId;
            addChildAndNormalize(result, cp);
        }
        return result;
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
                    (<HTMLImageElement>node).imageDataId = imageDataId;
                    break;
                default:
                    node = document.createElement(cp.nodeName);
            }
            frag.appendChild(node);
        }
        return frag;
    }

    let markupsForBlock = ["@js", "@java", "@important", "@less"];

    /**
     * converts the component list to a styled document fragment.
     */
    export function* convertToStyledDocumentFragment(components:Component[]):IterableIterator<any> {

        let tags: Set<string> = new Set();
        let references: Set<number> = new Set();

        //create a document fragment, this will be parent of all other converted components.
        let frag = document.createDocumentFragment();
        /**
         * if i encounter @js, @java, @important, or @less, then create a div and temporarily append the converted components
         * to this div. this div is used to style the background color. that is, if you have an @important block, the entire
         * block needs to have light blue background, and i need a div to achieve that. inspect the dom elements in the browser
         * to have a better understanding.
         */
        let styledContainer:HTMLDivElement;
        let codeBlockLanguage: SyntaxHighlightNamespace.Language;

        //if styled container is available, append converted components to the styled container, otherwise append to document fragment.
        function getParent():Node {
            return styledContainer ? styledContainer : frag;
        }

        for (let i = 0; i < components.length; i++) {
            let cp = components[i];
            switch (cp.nodeName) {
                case textNodeName:
                    //needs to start with @ symbol. but if its exactly @, then it means end of a block, this case is covered later.
                    //the following logic either start a styledContainer (such as @js, @important), or cannot be inside a styledContainer, such
                    //as @header and @line. and thats why i need to make sure styledContainer is undefined first.
                    if (cp.value.startsWith("@") && cp.value !== "@" && styledContainer === undefined) {
                        //if the line has previous sibling or next sibling, they need to br. otherwise the text node may not be a new line, it could
                        //be a next node following an image node or something.
                        if ((components[i - 1] === undefined || components[i - 1].nodeName === "br")
                            && (components[i + 1] === undefined || components[i + 1].nodeName === "br")) {
                            //the above if conditions basically says:
                            //if i have a line, and the line either starts with @header, or is exactly @line, @java, @js, @important or @less.
                            if (cp.value.startsWith("@header ")) {
                                /**
                                 * previous line text <br>
                                 * @header headerText <br>  <-- this br makes sure @header is on its own line in the source code.
                                 */
                                let header = document.createElement("h2");
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
                                /**
                                 * sample:
                                 * previous line text <br>
                                 * @js <br> <-- this br makes sure @js is on its own line in the source code
                                 */
                                let ii = markupsForBlock.indexOf(cp.value);
                                if (ii > -1) {
                                    styledContainer = document.createElement("div");
                                    //if markup is @js, then class name is js. if @java, then class name is java.
                                    //@important -> important. @less -> less.
                                    styledContainer.classList.add(cp.value.substring(1));

                                    //if @js, or @java, then i need to start to parse code blocks.
                                    if (ii === 0) {
                                        codeBlockLanguage = SyntaxHighlightNamespace.Language.js;
                                    } else if (ii === 1) {
                                        codeBlockLanguage = SyntaxHighlightNamespace.Language.java;
                                    }
                                    frag.appendChild(styledContainer);
                                    i++; //skip the br
                                    continue;
                                }
                            }
                        }
                    } else if (cp.value === "@" && styledContainer) {
                        //if we have a styledContainer in place then a single line with only a @ symbol means end of the styledContainer.
                        if ((components[i - 1] === undefined || components[i - 1].nodeName === "br")
                            && (components[i + 1] === undefined || components[i + 1].nodeName === "br")) {
                            //the previous if condition checks whether @ is on its own line.
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
                            if (styledContainer.lastChild)
                            //in case one, remove the br. this br is the last child of styledContainer now.
                                styledContainer.removeChild(styledContainer.lastChild);
                            i++; //skip next br
                            styledContainer = undefined;
                            codeBlockLanguage = undefined; //in case that previous block is a code block
                            continue;
                        }
                    }

                    if (codeBlockLanguage !== undefined) {
                        parseCode(getParent(), cp.value, codeBlockLanguage);
                    } else {
                        let tagsAndReferences = convertStyledParagraph(getParent(), cp.value);
                        //collect the tags and references found in this paragraph to tags and references.
                        for(let tag of tagsAndReferences.tags)
                            tags.add(tag);
                        for(let reference of tagsAndReferences.references)
                            references.add(reference);
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
                    getParent().appendChild(img);
                    break;
                default:
                    getParent().appendChild(document.createElement(cp.nodeName));
            }

        }

        return {
            frag: frag,
            tags: tags,
            references: references
        };
    }

    /**
     * convert components to styled paragraph.
     */
    function convertStyledParagraph(parent:Node, text:string): {tags: Set<string>, references: Set<number>} {

        let si = 0; //starting or continue processing from this point
        let cmi = -1; //code markup index, sample: abc`some code`abc
        let bmi = -1; //bold markup index, sample: abc~bold text~abc
        let imi = -1; //italic markup index, sample: abc_italic text_abc
        let tmi = -1; //tag markup index, sample: abc#tag#abc

        let tags: Set<string> = new Set();
        let references: Set<number> = new Set();

        for (let i = 0; i < text.length; i++) {
            let c = text[i];
            if (c === '`') {
                if (cmi == -1) {
                    //if this is the first ` encountered, remember its place
                    cmi = i;
                } else {
                    //i have already found one ` before, so with the current one i can a complete abc`some code` form.
                    //create a text node for text before the code snippet. in abc`some code` it would be abc.
                    let tn = document.createTextNode(text.substring(si, cmi));
                    parent.appendChild(tn);
                    //create a text node for the code span.
                    let sp = document.createElement("span");
                    sp.classList.add("inlineCode");
                    sp.appendChild(document.createTextNode(text.substring(cmi + 1, i)));
                    parent.appendChild(sp);
                    //if i have encountered other markups before, ignore them now. for instance, _aaa`some~code`, the _ and ~
                    //can now be ignored, cos they didn't manage to form their own complete form in time.
                    cmi = -1;
                    bmi = -1;
                    imi = -1;
                    tmi = -1;
                    //if subsequently another code/bold/italic span is found, then the normal unstyled substring
                    //before that span should start from i+1. that is, it should start from the next character after
                    //the current span.
                    si = i + 1;
                }
            } else if (c === '~') {
                if (bmi == -1) {
                    bmi = i;
                } else {
                    let tn = document.createTextNode(text.substring(si, bmi));
                    parent.appendChild(tn);
                    let sp = document.createElement("span");
                    sp.classList.add("emphasis");
                    sp.appendChild(document.createTextNode(text.substring(bmi + 1, i)));
                    parent.appendChild(sp);
                    cmi = -1;
                    bmi = -1;
                    imi = -1;
                    tmi = -1;
                    si = i + 1;
                }
            } else if (c === '_') {
                if (imi == -1) {
                    imi = i;
                } else {
                    let tn = document.createTextNode(text.substring(si, imi));
                    parent.appendChild(tn);
                    let sp = document.createElement("span");
                    sp.classList.add("italic");
                    sp.appendChild(document.createTextNode(text.substring(imi + 1, i)));
                    parent.appendChild(sp);
                    cmi = -1;
                    bmi = -1;
                    imi = -1;
                    tmi = -1;
                    si = i + 1;
                }
            } else if (c === '#') {
                if (tmi == -1) {
                    tmi = i;
                } else {
                    let tn = document.createTextNode(text.substring(si, tmi));
                    parent.appendChild(tn);
                    let sp = document.createElement("span");
                    sp.classList.add("tag");
                    let tagText = text.substring(tmi + 1, i);
                    tags.add(tagText);
                    sp.appendChild(document.createTextNode("#" + tagText + "#"));
                    parent.appendChild(sp);
                    cmi = -1;
                    bmi = -1;
                    imi = -1;
                    tmi = -1;
                    si = i + 1;
                }
            }
        }

        if (si === 0) {
            //if no pattern has been observed. create a text node for the entire text.
            parent.appendChild(document.createTextNode(text))
        } else {
            //create a text node for the substring after the last code/bold/italic span.
            parent.appendChild(document.createTextNode(text.substring(si)));
        }

        return {
            tags: tags,
            references: references
        };
    }
}