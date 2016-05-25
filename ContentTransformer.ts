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
    const brNodeName = "br";

    /**
     * if the component represents a text node, then the text is value.
     * if the component represents a canvas, then the imageDataId is the id of the corresponding image blob stored in db.
     * if the component represents a div, or other types that may have children, then the components that represents the
     * children are stored in children property.
     */
    export interface Component {
        nodeName: string;
        value?: string;
        imageDataId?: number;
    }

    /**
     * convert the code editor to component tree. the code editor itself is transformed into a document fragment.
     */
    export function convertToComponentFormat(codeEditor: Node): Component[] {
        let result = [];
        for(let i = 0; i < codeEditor.childNodes.length; i++) {
            let node = codeEditor.childNodes[i];
            let cp: Component = {nodeName: node.nodeName.toLowerCase()};
            if(cp.nodeName === textNodeName) cp.value = node.nodeValue;
            if(cp.nodeName === imgNodeName) cp.imageDataId = (<HTMLImageElement>node).imageDataId;
            addChildAndNormalize(result, cp);
        }
        return result;
    }

    export function addChildAndNormalize(result:Component[], child:Component) {
        if(result.length === 0) {
            result.push(child);
            return;
        }

        let li = result.length - 1;
        if(result[li].nodeName === textNodeName && child.nodeName === textNodeName) {
            result[li].value += child.value;
        } else {
            result.push(child);
        }
    }

    /**
     * build the dom nodes based on given component tree.
     */
    export function* convertToDocumentFragment(components: Component[]): IterableIterator<any>{
        let frag = document.createDocumentFragment();
        for(let i = 0; i < components.length; i++) {
            let cp = components[i];
            let node;
            switch(cp.nodeName) {
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
                    node =  document.createElement(cp.nodeName);
            }
            frag.appendChild(node);
        }
        return frag;
    }

    export function* convertToStyledDocumentFragment(components: Component[]) {
        
    }
}