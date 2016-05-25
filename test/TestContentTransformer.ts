///<reference path="../ContentTransformer.ts"/>
///<reference path="TestUtil.ts"/>
///<reference path="TestStorage.ts"/>
///<reference path="../CodeEditor.ts"/>

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
    import convertToStyledDocumentFragment = ContentTransformerNamespace.convertToStyledDocumentFragment;
    import createCodeEditor = CodeEditorNamespace.createCodeEditor;

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

    function testConvertToStyledDocumentFragment(){
        let codeEditor, parsedContent;

        function parse(){
            let components = codeEditor.getValue();
            r(function*(){
                let parsedDom = yield* convertToStyledDocumentFragment(components);
                while(parsedContent.firstChild)
                    parsedContent.removeChild(parsedContent.firstChild);
                parsedContent.appendChild(parsedDom);
            });
        }

        r(function*(){
            let testContainer = document.createElement("div");
            testContainer.appendChild(document.createTextNode("parse content test"));

            let left = document.createElement("div");
            left.style.width = "50%";
            left.style.cssFloat = "left";
            testContainer.appendChild(left);
            let idb = yield getIDB();
            codeEditor = createCodeEditor(idb);
            left.appendChild(codeEditor.containerEle);

            var toggleImageInsertButton = document.createElement("button");
            toggleImageInsertButton.innerText = "Insert Images";
            toggleImageInsertButton.onclick = function(){
                codeEditor.startInsertingImg();
            };
            left.appendChild(toggleImageInsertButton);

            let right = document.createElement("div");
            right.style.width = "50%";
            right.style.cssFloat = "left";
            testContainer.appendChild(right);

            parsedContent = document.createElement("div");
            parsedContent.classList.add("noteViewer");
            right.appendChild(parsedContent);

            let footer = document.createElement("div");
            footer.style.clear = "both";
            testContainer.appendChild(footer);

            document.body.appendChild(testContainer);

            codeEditor.containerEle.addEventListener("keyup", parse);
        })
    }

    export function runContentTransformerTest(){
        testConvertToComponentFormat();
        testConvertToDocumentFragment();
        testConvertToStyledDocumentFragment();
    }

}