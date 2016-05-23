///<reference path="../Storage.ts"/>
///<reference path="../CodeEditor.ts"/>

var globalCodeEditor;

namespace TestCodeEditorNamespace {
    import getIDB = StorageNamespace.getIDB;
    import storeImageBlob = StorageNamespace.storeImageBlob;
    import createCodeEditor = CodeEditorNamespace.createCodeEditor;
    import Component = ContentTransformerNamespace.Component;
    import r = Utility.r;

    export function runCodeEditorTest(){
        r(function*(){
            let idb = yield getIDB();
            let codeEditor = createCodeEditor(idb, storeImageBlob);
            globalCodeEditor = codeEditor;
            document.body.appendChild(codeEditor.containerEle);

            var toggleImageInsertButton = document.createElement("button");
            toggleImageInsertButton.innerText = "Insert Images";
            toggleImageInsertButton.onclick = function(){
                codeEditor.startInsertingImg();
            };

            var components: Component[];
            var getValueAndClearButton = document.createElement("button");
            getValueAndClearButton.innerText = "Get value";
            getValueAndClearButton.onclick = function(){
                components = codeEditor.getValue();
            };

            var setValueButton = document.createElement("button");
            setValueButton.innerText = "Set value";
            setValueButton.onclick = function(){
                if(components) codeEditor.setValue(components);
            };

            document.body.appendChild(toggleImageInsertButton);
            document.body.appendChild(getValueAndClearButton);
            document.body.appendChild(setValueButton);
        });
    }
}
