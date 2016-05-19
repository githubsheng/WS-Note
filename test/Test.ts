///<reference path="TestStorage.ts"/>
///<reference path="TestTextProcessor.ts" />
///<reference path="TestIndex.ts" />
///<reference path="TestCodeEditor.ts"/>

runIndexTest();
runTextProcessorTest();
TestStorageNamespace.runStorageTest();
TestCodeEditorNamespace.runCodeEditorTest();

// var idb = getIDB();
// var editor = createCodeEditor(idb, StorageNamespace.s);
// document.body.appendChild(editor.containerEle);
//
