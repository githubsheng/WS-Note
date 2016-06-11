///<reference path="AsyncUtil.ts"/>
///<reference path="ViewNote.ts"/>

namespace PreviewWindowNamespace {
    import r = Utility.r;
    import generateNoteViewerContent = ViewNote.generateNoteViewerContent;
    let body = document.querySelector("#body");
    let previewWindow: HTMLDivElement = <HTMLDivElement>document.querySelector("#preview");
    let noteViewerEle: HTMLDivElement;

    export function closePreview(){
        body.classList.remove("whenPreview");
        previewWindow.style.display = "none";
        if(noteViewerEle) {
            noteViewerEle.remove();
            noteViewerEle = undefined;
        }
    }

    export function* refreshPreviewIfPreviewIsOpen(note: Note){
        if(noteViewerEle === undefined) return; //preview is not open
        noteViewerEle.remove();
        noteViewerEle = document.createElement("div");
        noteViewerEle.classList.add("noteViewer");
        yield* generateNoteViewerContent(noteViewerEle, note);
        previewWindow.appendChild(noteViewerEle);
    }

    export function displayPreview(note: Note):void {
        r(function*(){
            if(noteViewerEle) noteViewerEle.remove();
            noteViewerEle = document.createElement("div");
            noteViewerEle.classList.add("noteViewer");
            yield* generateNoteViewerContent(noteViewerEle, note);
            previewWindow.appendChild(noteViewerEle);
            previewWindow.style.display = "block";
            body.classList.add("whenPreview");
        });
    }
}
