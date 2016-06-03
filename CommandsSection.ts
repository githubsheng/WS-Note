namespace CommandsSectionNamespace {

    let headerRight = document.querySelector("#headerRight");

    export function setCommandButtons(buttons: HTMLButtonElement[]){
        while(headerRight.firstChild) headerRight.removeChild(headerRight.firstChild);
        for(let button of buttons) headerRight.appendChild(button);
    }
    
}