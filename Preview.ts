///<reference path="ContentTransformer.ts"/>

import convertToStyledDocumentFragment = ContentTransformerNamespace.convertToStyledDocumentFragment;
import r = Utility.r;

let body = document.querySelector("#previewBody");
window.addEventListener("message", function (event:MessageEvent) {
    let components:Component[] = event.data;
    r(function*() {
        let domFrag = yield* convertToStyledDocumentFragment(components);
        while (body.firstChild)
            body.removeChild(body.firstChild);
        body.appendChild(domFrag);
    });
});