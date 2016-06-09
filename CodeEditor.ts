///<reference path="ImageCanvasUtility.ts"/>
///<reference path="ContentTransformer.ts"/>

namespace CodeEditorNamespace {

    import convertToComponentFormat = ContentTransformerNamespace.convertToComponentFormat;
    import createCanvasBasedOnImageData = Utility.createCanvasBasedOnImageData;
    import r = Utility.r;
    import convertToDocumentFragment = ContentTransformerNamespace.convertToDocumentFragment;
    import createImageFromBlob = Utility.createImageFromBlob;
    import storeImageBlob = StorageNamespace.storeImageBlob;
    import createCanvasBasedOnImage = Utility.createCanvasBasedOnImage;
    import getIDB = StorageNamespace.getIDB;

    export interface CodeEditor {
        containerEle:HTMLElement;
        startInsertingImg:() => void;
        getValue:() => Component[];
        setValue:(components:Component[]) => void;
        getTitle:() => string;
        setTitle:(title: string) => void;
        setValueChangeListener: (listener:() => void) => void;
    }

    export function createCodeEditor():CodeEditor {

        let containerEle = document.createElement("div");
        containerEle.classList.add("codeEditorContainer");

        let noteTitleEle = document.createElement("input");
        noteTitleEle.placeholder = "Please input note title";
        noteTitleEle.classList.add("titleInput");

        let codeEditorEle = document.createElement("div");
        codeEditorEle.classList.add("codeEditor");
        codeEditorEle.contentEditable = "true";

        let dropContainerEle = document.createElement('div');
        dropContainerEle.classList.add("codeEditorDropGround");

        containerEle.appendChild(noteTitleEle);
        containerEle.appendChild(codeEditorEle);
        containerEle.appendChild(dropContainerEle);

        //this value change listener will be called whenever the content of code editor changes.
        let valueChangeListener: () => void;
        function setValueChangeListener(listener: () => void){
            valueChangeListener = listener;
        }

        noteTitleEle.addEventListener("keyup", function(){
            if(valueChangeListener) valueChangeListener();
        });

        codeEditorEle.addEventListener('keydown', keyHandler);
        function keyHandler(e:KeyboardEvent) {
            const TAB_KEY = 9;
            const TAB_SPACE = "    ";
            const ENTER_KEY = 13;
            if (e.keyCode == TAB_KEY) {
                //when user press tab key, it should insert a 4 whitespace indent, rather than changing element focus
                document.execCommand("insertText", false, TAB_SPACE);
                e.preventDefault();
                return false;
            } else if (e.keyCode === ENTER_KEY) {
                let selection = window.getSelection();
                let range = selection.getRangeAt(0);
                range.deleteContents();
                let br = document.createElement("br");
                range.insertNode(br);
                //webkit sometimes oddly inserts a text with empty value "". this empty text node turns out be to useless
                //and results in the following check !br.nextSibling to be false positive. therefore I remove this text node.
                //so far in practice i can do just fine without this empty text node.
                if(br.nextSibling && br.nextSibling.nodeName === "#text" && br.nextSibling.nodeValue === "")
                    codeEditorEle.removeChild(br.nextSibling);
                if(!br.nextSibling && (br.previousSibling && br.previousSibling.nodeName.toLowerCase() !== "br")) {
                    br = document.createElement("br");
                    codeEditorEle.insertBefore(br, br.nextSibling);
                }
                let newRange = new Range();
                newRange.setEndAfter(br);
                newRange.collapse(false);
                selection.removeAllRanges();
                selection.addRange(newRange);
                e.preventDefault();
                return false;
            }
        }

        //key down event may be fired many times, only notify a value change when key up.
        codeEditorEle.addEventListener("keyup", function(){
            if(valueChangeListener) valueChangeListener();
        });

        //only allow user to paste in plain text, if the pasted text is not plain text, transfer it to plain text.
        codeEditorEle.addEventListener("paste", pastePlainText);
        function pastePlainText(evt:ClipboardEvent) {
            evt.preventDefault();
            let pastePlainString = evt.clipboardData.getData("text/plain");
            if (pastePlainString.trim() !== "") {
                let lines = pastePlainString.split('\n');
                let htmlStr = "";
                for (let line of lines) {
                    //replaces all potential html markup.
                    if(line !== "") htmlStr += line.replace('<', "&lt;").replace('>', "&gt;");
                    htmlStr += "<br>"
                }
                document.execCommand("insertHTML", false, htmlStr);
                if(valueChangeListener) valueChangeListener();
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

        //When the user drops files, store the file if the files are images, and insert the images in editor
        dropContainerEle.ondrop = function (e) {
            r(function*() {
                let idb = yield getIDB();
                let files = e.dataTransfer.files; // The dropped files
                for (let i = 0; i < files.length; i++) {
                    let file = files[i];
                    let type = file.type;
                    if (type.substring(0, 6) !== "image/")
                        //Skip any none images
                        continue;
                    let imgId = yield storeImageBlob(idb, file);
                    let img:HTMLImageElement = yield createImageFromBlob(file);
                    img.imageDataId = imgId;

                    let selection = window.getSelection();
                    let range = selection.getRangeAt(0);
                    range.insertNode(img);

                    let newRange = new Range();
                    newRange.setEndAfter(img);
                    newRange.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                }
                //Unhighlight droptarget
                dropContainerEle.classList.remove("active");
                dropContainerEle.style.zIndex = "1";
                codeEditorEle.focus();
                //once the images are ready, notify listeners that values have changed.
                if(valueChangeListener) valueChangeListener();
            });
            //I've handled the drop
            return false;
        };

        function getTitle(): string{
            return noteTitleEle.value;
        }

        function getValue(): Component[] {
            return convertToComponentFormat(codeEditorEle);
        }

        function setTitle(title: string): void{
            noteTitleEle.value = title;
        }

        function setValue(components: Component[]): void {
            while(codeEditorEle.firstChild) {
                codeEditorEle.removeChild(codeEditorEle.firstChild);
            }
            r(function*(){
                let fragment: DocumentFragment = yield* convertToDocumentFragment(components);
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
            setValue: setValue,
            getTitle: getTitle,
            setTitle: setTitle,
            setValueChangeListener: setValueChangeListener
        }

    }

}
