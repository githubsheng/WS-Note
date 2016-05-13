interface CodeEditor {
    containerEle: HTMLElement;
    getValue: () => string;
}

function createCodeEditor(): CodeEditor {

    let editor = document.createElement("textarea");

    function getValue(){
        return editor.value;
    }

    return {
        containerEle: editor,
        getValue: getValue
    };

}