interface CodeEditor {
    containerEle:HTMLElement;
    insertImage:(id: number) => void;
    getValue:() => string;
}

function createCodeEditor():CodeEditor {
    let containerEle = document.createElement("div");
    containerEle.classList.add("codeEditor");
    containerEle.contentEditable = "true";

    containerEle.addEventListener('keydown', keyHandler);
    function keyHandler(e:KeyboardEvent) {
        const TAB_KEY = 9;
        const TAB_SPACE = "    ";
        if (e.keyCode == TAB_KEY) {
            document.execCommand("insertText", false, TAB_SPACE);
            e.preventDefault();
            return false;
        }
    }

    function pastePlainText (evt:ClipboardEvent) {
        evt.preventDefault();
        let pastePlainString = evt.clipboardData.getData("text/plain");
        if (pastePlainString.trim() !== "") {
            let lines = pastePlainString.split('\n');
            let htmlStr = "";
            for (let line of lines) {
                //if the line is empty, give it a <br>
                //replaces all potential html markup.
                let newLine = line === "" ? "<br>" : line.replace('<', "&lt;").replace('>', "&gt;");
                htmlStr += "<div>" + newLine + "</div>";
            }
            document.execCommand("insertHTML", false, htmlStr);
        }
    }

    containerEle.addEventListener("paste", pastePlainText);

    let recordedRangeWhenFocusLost: Range;

    function recordCaretPositionInEditor() {
        recordedRangeWhenFocusLost = window.getSelection().getRangeAt(0);
    }

    containerEle.addEventListener("blur", recordCaretPositionInEditor);

    function insertImage(id: number) {
        let previousEndContainer = recordedRangeWhenFocusLost.endContainer;
        let previousEndOffset = recordedRangeWhenFocusLost.endOffset;
        let newRange = document.createRange();
        newRange.setStart(previousEndContainer, previousEndOffset);
        newRange.setEnd(previousEndContainer, previousEndOffset);
        newRange.collapse(true);
        let selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(newRange);
        //execCommand works on active content editable element. and therefore I need to set focus on this element first.
        containerEle.focus();
        document.execCommand("insertImage", false, "fakeSrc");
    }

    function getValue():string {
        return "";
    }

    return {
        containerEle: containerEle,
        insertImage: insertImage,
        getValue: getValue
    }

}