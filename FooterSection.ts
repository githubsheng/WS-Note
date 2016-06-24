///<reference path="Util.ts"/>
///<reference path="AppEvents.ts"/>

namespace FooterSectionNamespace {

    import button = Utility.button;
    import broadcast = AppEventsNamespace.broadcast;
    import AppEvent = AppEventsNamespace.AppEvent;
    let footerHint: HTMLDivElement = <HTMLDivElement>document.querySelector("#footerRight");
    let footerBackNavigation: HTMLDivElement = <HTMLDivElement>document.querySelector("#footerLeft");

    export function setHint(hint: string) {
        footerHint.innerText = hint;
    }

    function clearFooterBackNav(){
        while(footerBackNavigation.firstChild) footerBackNavigation.removeChild(footerBackNavigation.firstChild);
    }
    
    export function setBackNavigation(noteName: string, noteId: number) {
        clearFooterBackNav();
        footerBackNavigation.appendChild(button("<< back to: " + noteName, function(evt: MouseEvent){
            clearFooterBackNav();
            broadcast(AppEvent.viewNote, noteId);
        }));
    }

}