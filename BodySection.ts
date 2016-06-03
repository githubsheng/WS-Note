namespace BodySectionNamespace {

    let body = document.querySelector("#body");

    export function setBody(frag: DocumentFragment){
        while(body.firstChild) body.removeChild(body.firstChild);
        body.appendChild(frag);
    }

}