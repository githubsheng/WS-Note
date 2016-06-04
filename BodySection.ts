namespace BodySectionNamespace {

    let body = document.querySelector("#body");

    export function setBody(body: Node){
        while(body.firstChild) body.removeChild(body.firstChild);
        body.appendChild(body);
    }

}