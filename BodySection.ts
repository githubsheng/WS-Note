namespace BodySectionNamespace {

    let body = document.querySelector("#body");

    export function setBody(content: Node){
        while(body.firstChild) body.removeChild(body.firstChild);
        body.appendChild(content);
    }

}