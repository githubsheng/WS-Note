///<reference path="typings/extended.d.ts"/>
///<reference path="Storage.ts"/>
///<reference path="AsyncUtil.ts"/>
///<reference path="FreeDraw.ts"/>

namespace ContentTransformerNamespace {

    import getImageBlob = StorageNamespace.getImageBlob;
    import getIDB = StorageNamespace.getIDB;

    export interface Component {
        nodeName: string;
        value?: string;
        imageDataId?: number;
        children?: Component[];
    }

    export function convertToStorageFormat(codeEditorEle: HTMLDivElement): Component {
        let root: Component = {nodeName: "root", children: []};
        for(let i = 0; i < codeEditorEle.childNodes.length; i++) {
            root.children.push(convertToStorageFormatHelper(codeEditorEle.childNodes[i]));
        }
        return root;
    }

    function convertToStorageFormatHelper(node: Node):Component{
        let cp: Component = {nodeName: node.nodeName.toLowerCase(), children: []};
        if(cp.nodeName === "#text") cp.value = node.nodeValue;
        if(cp.nodeName === "canvas") cp.imageDataId = (<HTMLCanvasElement>node).imageDataId;
        for(let i = 0; i < node.childNodes.length; i++)
            cp.children.push(convertToStorageFormatHelper(node.childNodes[i]));
        return cp;
    }

    export function* convertToDomNode(root: Component){
        let frag = document.createDocumentFragment();
        for(let i = 0; i < root.children.length; i++) {
            let cp = root.children[i];
            let node = yield* convertToDomNodeHelper(cp);
            frag.appendChild(node);
        }
        return frag;
    }

    function* convertToDomNodeHelper(cp: Component):IterableIterator<any> {
        let node: Node;
        switch(cp.nodeName) {
            case "#text":
                node = document.createTextNode(cp.value);
                break;
            case "canvas":
                let idb = yield getIDB();
                let imageDataId = cp.imageDataId;
                let imageData = yield getImageBlob(idb, imageDataId);
                node = yield* createCanvasBasedOnImageData(imageData, imageDataId);
                break;
            default:
                node = document.createElement(cp.nodeName);
        }
        for(let i = 0; i < cp.children.length; i++) {
            let child = yield* convertToDomNodeHelper(cp.children[i]);
            node.appendChild(child);
        }
        return node;
    }
}