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
    import shouldBeEqual = TestUtilNamespace.shouldBeEqual;
    import normalizeComponents = TestUtilNamespace.normalizeComponents;
    import createDummyDomContent = TestUtilNamespace.createDummyDomContent;
    import createDummyComponents = TestUtilNamespace.createDummyComponents;

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