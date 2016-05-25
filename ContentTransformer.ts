///<reference path="typings/extended.d.ts"/>
///<reference path="Storage.ts"/>
///<reference path="AsyncUtil.ts"/>
///<reference path="ImageCanvasUtility.ts"/>

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
     * convert the code editor to component tree. the code editor itself is transformed into a document fragment.
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

    export function* convertToStyledDocumentFragment(components:Component[]):IterableIterator<any> {
        let frag = document.createDocumentFragment();
        let styledContainer:HTMLDivElement;
        let isParsingCodeBlock = false;
        let markupsForBlock = ["@js", "@java", "@important", "@less"];

        for (let i = 0; i < components.length; i++) {
            let cp = components[i];
            let node;
            switch (cp.nodeName) {
                case textNodeName:
                    if (cp.value.startsWith("@") && cp.value !== "@" && styledContainer === undefined) {
                        if ((components[i - 1] === undefined || components[i - 1].nodeName === "br")
                            && (components[i + 1] === undefined || components[i + 1].nodeName === "br")) {
                            if (cp.value.startsWith("@header ")) {
                                let header = document.createElement("h2");
                                let headerText = cp.value.substring(8);
                                header.appendChild(document.createTextNode(headerText));
                                frag.appendChild(header);
                                i++;
                                continue;
                            } else if (cp.value === "@line") {
                                let horizontalLine = document.createElement("hr");
                                frag.appendChild(horizontalLine);
                                i++;
                                continue;
                            } else {
                                let ii = markupsForBlock.indexOf(cp.value);
                                if (ii > -1) {
                                    styledContainer = document.createElement("div");
                                    styledContainer.classList.add(cp.value.substring(1));
                                    if (ii < 2) isParsingCodeBlock = true;
                                    frag.appendChild(styledContainer);
                                    i++;
                                    continue;
                                }
                            }
                        }
                    }
                    else if (cp.value === "@" && styledContainer) {
                        if ((components[i - 1] === undefined || components[i - 1].nodeName === "br")
                            && (components[i + 1] === undefined || components[i + 1].nodeName === "br")) {
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
                            if(styledContainer.lastChild)
                                //in case one, remove the br. this br is the last child of styledContainer now.
                                styledContainer.removeChild(styledContainer.lastChild);
                            i++; //skip next br
                            styledContainer = undefined;
                            isParsingCodeBlock = false; //in case that previous block is a code block
                            continue;
                        }
                    }
                    node = document.createTextNode(cp.value);
                    break;
                case
                imgNodeName:
                    let idb = yield getIDB();
                    let imageDataId = cp.imageDataId;
                    let imageData = yield getImageBlob(idb, imageDataId);
                    node = yield createImageFromBlob(imageData);
                    (<HTMLImageElement>node).imageDataId = imageDataId;
                    break;
                default:
                    node = document.createElement(cp.nodeName);
            }
            if (styledContainer) {
                styledContainer.appendChild(node);
            } else {
                frag.appendChild(node);
            }
        }

        return frag;
    }
}