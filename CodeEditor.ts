///<reference path="test/TestStorage.ts"/>
///<reference path="FreeDraw.ts"/>
///<reference path="ContentTransformer.ts"/>

namespace CodeEditorNamespace {

    import Component = ContentTransformerNamespace.Component;
    import convertToStorageFormat = ContentTransformerNamespace.convertToStorageFormat;
    import convertToDomNode = ContentTransformerNamespace.convertToDomNode;

    export interface CodeEditor {
        containerEle:HTMLElement;
        startInsertingImg:() => void;
        getValue:() => Component;
        clearContent:() => void;
        setValue:(root:Component) => void;
    }

    interface StorageImageFunc {
        (idb:IDBDatabase, image:Blob, id?:number):Promise<number>;
    }

    export function createCodeEditor(idb:IDBDatabase, storeImage:StorageImageFunc):CodeEditor {
        let containerEle = document.createElement("div");
        containerEle.classList.add("codeEditorContainer");

        let codeEditorEle = document.createElement("div");
        codeEditorEle.classList.add("codeEditor");
        codeEditorEle.contentEditable = "true";

        let dropContainerEle = document.createElement('div');
        dropContainerEle.classList.add("codeEditorDropGround");

        containerEle.appendChild(codeEditorEle);
        containerEle.appendChild(dropContainerEle);

        //when user press tab key, it should insert a 4 whitespace indent, rather than changing element focus
        codeEditorEle.addEventListener('keydown', keyHandler);
        function keyHandler(e:KeyboardEvent) {
            const TAB_KEY = 9;
            const TAB_SPACE = "    ";
            if (e.keyCode == TAB_KEY) {
                document.execCommand("insertText", false, TAB_SPACE);
                e.preventDefault();
                return false;
            }
        }

        //only allow user to paste in plain text, if the pasted text is not plain text, transfer it to plain text.
        codeEditorEle.addEventListener("paste", pastePlainText);
        function pastePlainText(evt:ClipboardEvent) {
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

        let referenceRangeToInsertNode:Range;
        codeEditorEle.addEventListener("blur", codeEditorFocusLostHandler);
        function codeEditorFocusLostHandler() {
            referenceRangeToInsertNode = window.getSelection().getRangeAt(0);
        }

        dropContainerEle.ondragenter = function (e) {
            //if the drag is something other than files, ignore it.
            var types = e.dataTransfer.types;
            if ((types.contains && types.contains("Files")) || (types["indexOf"] && types["indexOf"]("Files") != -1)) {
                //highlight the drop container element
                dropContainerEle.classList.add("active");
                //return false to show interest to the drag and drop.
                return false;
            }
        };

        //change the style of the drop zone if the user moves out of it
        dropContainerEle.ondragleave = function () {
            dropContainerEle.classList.remove("active");
        };

        // This handler just tells the browser to keep sending notifications (that Im still interested)
        dropContainerEle.ondragover = function () {
            return false;
        };

        const brNodeType = 1;

        function insertCanvasAtReferenceRangeAndSetCaret(canvas:HTMLCanvasElement) {
            if (referenceRangeToInsertNode === undefined) {
                //in rare cases, use may have never focused on the editor. he may open a note directly and just
                //start inserting images, in this case no caret range has been recorded yet.
                codeEditorEle.appendChild(canvas);
            } else {
                referenceRangeToInsertNode.insertNode(canvas);
            }

            /*
             I want br surrounding the canvas, so that the canvas can be placed on its own line. br is also useful
             when it comes to placing the caret. Please see the annotations below.
             */
            let parent = canvas.parentNode;
            if (canvas.previousSibling && canvas.previousSibling.nodeType !== brNodeType) {
                let brBeforeCanvas = document.createElement("br");
                parent.insertBefore(brBeforeCanvas, canvas);
            }

            if (!canvas.nextSibling || (canvas.nextSibling && canvas.nextSibling.nodeType !== brNodeType)) {
                let brAfterCanvas = document.createElement("br");
                parent.insertBefore(brAfterCanvas, canvas.nextSibling);
            }

            //has to create a new range. modifying existing ones won't work
            let newRange = document.createRange();

            /*
             set the caret to be the br after canvas.
             i cannot set a caret directly after a canvas element because browser simply does not allow this.
             in this case br is ideal because:
             1. it is allowed to place the caret behind the br.
             2. br itself is a line break, and I want each image to be in a separate line.
             */
            newRange.setStartAfter(canvas.nextSibling);
            newRange.collapse(true); //collapse to start
            let selection = window.getSelection();
            selection.removeAllRanges(); //normally there is only one range, unless i use js to select multiple range
            selection.addRange(newRange); //use the new range

            referenceRangeToInsertNode = newRange;
        }

        //When the user drops files, store the file if the files are images, and insert the images in editor
        dropContainerEle.ondrop = function (e) {
            r(function*() {
                let files = e.dataTransfer.files; // The dropped files
                for (let i = 0; i < files.length; i++) {
                    let file = files[i];
                    let type = file.type;
                    if (type.substring(0, 6) !== "image/")
                        //Skip any none images
                        continue;
                    let imgId:number = yield storeImage(idb, file);
                    // Use Blob URL with <img>
                    let canvas = yield* createCanvasBasedOnImageData(file, imgId);
                    insertCanvasAtReferenceRangeAndSetCaret(canvas);
                }
                //Unhighlight droptarget
                dropContainerEle.classList.remove("active");
                dropContainerEle.style.zIndex = "1";
                codeEditorEle.focus();
            });
            //I've handled the drop
            return false;
        };

        function getValue(): Component {
            return convertToStorageFormat(codeEditorEle);
        }

        function clearContent(){
            while(codeEditorEle.firstChild) {
                codeEditorEle.removeChild(codeEditorEle.firstChild);
            }
        }

        function setValue(root: Component): void {
            r(function*(){
                let fragment: DocumentFragment = yield* convertToDomNode(root);
                codeEditorEle.appendChild(fragment);
            });
        }

        function startInsertingImg() {
            dropContainerEle.style.zIndex = "3";
        }

        return {
            containerEle: containerEle,
            startInsertingImg: startInsertingImg,
            getValue: getValue,
            clearContent: clearContent,
            setValue: setValue
        }

    }

}
