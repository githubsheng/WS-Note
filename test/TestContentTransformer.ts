///<reference path="../ContentTransformer.ts"/>
///<reference path="TestUtil.ts"/>
///<reference path="TestStorage.ts"/>
///<reference path="../CodeEditor.ts"/>
///<reference path="../typings/chrome/chrome-app.d.ts" />


namespace TestContentTransformerNamespace {

    import convertToComponentFormat = ContentTransformerNamespace.convertToComponentFormat;
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
    import findTags = ContentTransformerNamespace.findTags;
    import arrayShouldBeIdentical = TestUtilNamespace.arrayShouldBeIdentical;
    import tokenize = TokenizorNamespace.tokenize;

    function testConvertToComponentFormat() {
        let codeEditorEle = document.createElement("div");
        createDummyDomContent(codeEditorEle);
        let expected = normalizeComponents(createDummyComponents());

        let result = convertToComponentFormat(codeEditorEle);
        for(let i = 0; i < expected.length; i++)
            shouldBeEqual(result[i], expected[i], function(resultComponent: Component, expectedComponent: Component):boolean {
                if(resultComponent.nodeName !== expectedComponent.nodeName) return false;
                if(resultComponent.value !== expectedComponent.value) return false;
                if(resultComponent.imageDataId !== expectedComponent.imageDataId) return false;
                if(resultComponent.isBlockLevelMarkup !== expectedComponent.isBlockLevelMarkup) return false;
                if(resultComponent.codeLanguage !== expectedComponent.codeLanguage) return false;
                if(resultComponent.noticeLevel !== expectedComponent.noticeLevel) return false;
                if(expectedComponent.tokens && expectedComponent.tokens.tokenTypes) {
                    if(expectedComponent.tokens.tokenTypes.length !== resultComponent.tokens.tokenTypes.length) return false;
                    for(let ii = 0; ii < resultComponent.tokens.tokenTypes.length; ii++) {
                        if(resultComponent.tokens.tokenTypes[ii] !== expectedComponent.tokens.tokenTypes[ii]) return false;
                        if(resultComponent.tokens.tokenValues[ii] !== expectedComponent.tokens.tokenValues[ii]) return false;
                    }
                }
                return true;
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
        r(function*(){
            let idb = yield getIDB();
            let imgId = yield* storeTestImage(idb);

            let components = createDummyComponents(imgId);
            let domFrag:DocumentFragment = yield* convertToStyledDocumentFragment(components);

            shouldBeEqual(domFrag.querySelectorAll(".codeSpecialSymbol").length, 8);
            shouldBeEqual(domFrag.querySelectorAll(".codeFunctionName").length, 2);
            shouldBeEqual(domFrag.querySelectorAll(".codeKeyword").length, 1);
            shouldBeEqual(domFrag.querySelectorAll(".inlineCode").length, 1);
            shouldBeEqual(domFrag.querySelectorAll("hr").length, 1);
            shouldBeEqual(domFrag.querySelectorAll("img").length, 1);
        });
    }

    function testFindTags(){
        let compOne:Component = {
            nodeName: "#text",
            value: "Hello Word Here is one #hashTag# and #another hashTag#"
        };
        compOne.tokens = tokenize(compOne);
        let compTwo:Component = {
            nodeName: "#text",
            value: "Finally a #final tag#"
        };
        compTwo.tokens = tokenize(compTwo);
        let tags = findTags([compOne, compTwo]);
        arrayShouldBeIdentical(["hashTag", "another hashTag", "final tag"], tags);
    }

    export function runContentTransformerTest(){
        testConvertToComponentFormat();
        testConvertToDocumentFragment();
        testConvertToStyledDocumentFragment();
        testFindTags();
    }

}