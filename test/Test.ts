///<reference path="TestStorage.ts"/>
///<reference path="TestTextProcessor.ts" />
///<reference path="TestIndex.ts" />
///<reference path="../CodeEditor.ts"/>

runIndexTest();
runTextProcessorTest();
runStorageTest();

var editor = createCodeEditor();
document.body.appendChild(editor.containerEle);