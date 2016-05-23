///<reference path="../ContentTransformer.ts"/>
///<reference path="TestUtil.ts"/>
///<reference path="TestStorage.ts"/>

namespace TestContentTransformerNamespace {

    import convertToComponentFormat = ContentTransformerNamespace.convertToComponentFormat;
    import Component = ContentTransformerNamespace.Component;
    import convertToDocumentFragment = ContentTransformerNamespace.convertToDocumentFragment;
    import r = Utility.r;
    import storeTestImage = TestStorageNamespace.storeTestImage;
    import getIDB = StorageNamespace.getIDB;
    import addChildAndNormalize = ContentTransformerNamespace.addChildAndNormalize;

    function tn(val: string){
        return document.createTextNode(val);
    }

    function br(){
        return document.createElement("br");
    }

    function img(imageDataId: number){
        let img = document.createElement("img");
        img.imageDataId = imageDataId;
        return img;
    }

    function createDummyDomContent(root: Node, imgId?: number){
        root.appendChild(tn("abc"));
        root.appendChild(tn("normalize"));
        root.appendChild(br());
        root.appendChild(br());
        root.appendChild(tn("def"));
        root.appendChild(br());
        root.appendChild(tn("ghi"));
        root.appendChild(img(imgId || 1));
        root.appendChild(br());
        root.appendChild(br());
    }

    function createDummyComponents(imgId?: number) {
        let components: Component[] = [];
        components.push({nodeName: "#text", value: "abc"});
        components.push({nodeName: "#text", value: "normalize"});
        components.push({nodeName: "br"});
        components.push({nodeName: "br"});
        components.push({nodeName: "#text", value: "def"});
        components.push({nodeName: "br"});
        components.push({nodeName: "#text", value: "ghi"});
        components.push({nodeName: "img", imageDataId: imgId || 1});
        components.push({nodeName: "br"});
        components.push({nodeName: "br"});
        return components;
    }
    
    function normalizeComponents(components: Component[]) {
        let normalized = [];
        for(let c of components) {
            addChildAndNormalize(normalized, c);
        }
        return normalized;
    }

    function testConvertToComponentFormat() {
        let codeEditorEle = document.createElement("div");
        createDummyDomContent(codeEditorEle);
        let expected = normalizeComponents(createDummyComponents());

        let result = convertToComponentFormat(codeEditorEle);
        for(let i = 0; i < expected.length; i++)
            shouldBeEqual(result[i], expected[i], function(a: Component, b: Component):boolean {
                let r = true;
                if(a.nodeName !== b.nodeName) r = false;
                if(a.value !== b.value) r = false;
                if(a.imageDataId !== b.imageDataId) r = false;
                return r;
            });

        return result;
    }

    function testConvertToDocumentFragment() {
        function compareDom(a:Node, b:Node){
            let r = true;
            if(a.nodeName !== b.nodeName) r= false;
            if(a.nodeValue !== b.nodeValue) r = false;
            if(a["imageDataId"] !== b["imageDataId"]) r = false;
            return r;
        }

        r(function*(){
            let idb = yield getIDB();
            let imgId = yield* storeTestImage(idb);

            let expectedDomFrag = document.createDocumentFragment();
            createDummyDomContent(expectedDomFrag, imgId);

            let components = createDummyComponents(imgId);
            let domFrag:DocumentFragment = yield* convertToDocumentFragment(components);

            for(let i = 0; i < expectedDomFrag.childNodes.length; i++) {
                shouldBeEqual(domFrag.childNodes[i], expectedDomFrag.childNodes[i], compareDom);
            }
        });
    }

    export function runContentTransformerTest(){
        testConvertToComponentFormat();
        testConvertToDocumentFragment();
    }

}