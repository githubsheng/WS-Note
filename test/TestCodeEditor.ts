///<reference path="../Storage.ts"/>
///<reference path="../CodeEditor.ts"/>

namespace TestCodeEditorNamespace {
    import getIDB = StorageNamespace.getIDB;
    import storeImageBlob = StorageNamespace.storeImageBlob;
    import createCodeEditor = CodeEditorNamespace.createCodeEditor;

    export function runCodeEditorTest(){
        r(function*(){
            let idb = yield getIDB();
            let codeEditor = createCodeEditor(idb, storeImageBlob);
            document.body.appendChild(codeEditor.containerEle);

            var toggleImageInsertButton = document.createElement("button");
            toggleImageInsertButton.innerText = "Insert Images";
            toggleImageInsertButton.onclick = function(){
                codeEditor.startInsertingImg();
            };
            document.body.appendChild(toggleImageInsertButton);
        });
    }
}
