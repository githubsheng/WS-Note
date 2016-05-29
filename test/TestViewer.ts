///<reference path="../ContentTransformer.ts"/>

import convertToStyledDocumentFragment = ContentTransformerNamespace.convertToStyledDocumentFragment;
import Component = ContentTransformerNamespace.Component;
import r = Utility.r;

let noteViewerEle = document.getElementById("noteViewer");

window.addEventListener("message", function(event: MessageEvent){
    let components: Component[] = event.data;
    r(function*(){
        let startTime = Date.now();
        let r = yield* convertToStyledDocumentFragment(components);
        let domFrag = r.frag;
        while(noteViewerEle.firstChild)
            noteViewerEle.removeChild(noteViewerEle.firstChild);
        noteViewerEle.appendChild(domFrag);
        let endTime = Date.now();
        console.log(endTime - startTime);
        let tags: {tags: Set<string>, references: Set<number>} = {tags: r.tags, references: r.references};
        event.source.postMessage(tags, event.origin);
    })
});