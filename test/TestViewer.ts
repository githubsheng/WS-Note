///<reference path="../ContentTransformer.ts"/>

import convertToStyledDocumentFragment = ContentTransformerNamespace.convertToStyledDocumentFragment;
import Component = ContentTransformerNamespace.Component;
import r = Utility.r;

let noteViewerEle = document.getElementById("noteViewer");

window.addEventListener("message", function(event: MessageEvent){
    let components: Component[] = event.data;
    r(function*(){
        let domFrag = yield* convertToStyledDocumentFragment(components);
        while(noteViewerEle.firstChild)
            noteViewerEle.removeChild(noteViewerEle.firstChild);
        noteViewerEle.appendChild(domFrag);
    })
});