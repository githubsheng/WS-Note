///<reference path="../ContentTransformer.ts"/>
///<reference path="TestUtil.ts"/>
///<reference path="TestStorage.ts"/>
///<reference path="../CodeEditor.ts"/>
///<reference path="../typings/chrome/chrome-app.d.ts" />

var globalViewerWindow;


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
    import AppWindow = chrome.app.window.AppWindow;

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
        let codeEditor, viewerWindow;

        function parse(){
            let components = codeEditor.getValue();
            viewerWindow.postMessage(components, "*");
        }

        r(function*(){
            let testContainer = document.createElement("div");
            testContainer.appendChild(document.createTextNode("parse content test"));

            let idb = yield getIDB();
            codeEditor = createCodeEditor(idb);
            codeEditor.setValueChangeListener(parse);
            testContainer.appendChild(codeEditor.containerEle);

            var toggleImageInsertButton = document.createElement("button");
            toggleImageInsertButton.innerText = "Insert Images";
            toggleImageInsertButton.onclick = function(){
                codeEditor.startInsertingImg();
            };
            testContainer.appendChild(toggleImageInsertButton);

            let openViewerButton = document.createElement("button");
            openViewerButton.appendChild(document.createTextNode("Open Viewer"));

            openViewerButton.onclick = function(){
                if(chrome && chrome.app && chrome.app.window) {
                    if(viewerWindow) viewerWindow.close();
                    chrome.app.window.create('test/html/viewer.html', {
                        'bounds': {
                            'width': 400,
                            'height': 400
                        }
                    }, function(appWindow: AppWindow) {
                        viewerWindow = appWindow.contentWindow;
                    });
                } else {
                    viewerWindow = window.open("viewer.html");
                }
            };
            testContainer.appendChild(openViewerButton);

            document.body.appendChild(testContainer);
        })
    }

    export function runContentTransformerTest(){
        testConvertToComponentFormat();
        testConvertToDocumentFragment();
        testConvertToStyledDocumentFragment();
    }

}