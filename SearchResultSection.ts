///<reference path="AppEvents.ts"/>
///<reference path="BodySection.ts"/>
///<reference path="CommandsSection.ts"/>

namespace SearchResultSectionNamespace {

    import broadcast = AppEventsNamespace.broadcast;
    import AppEvent = AppEventsNamespace.AppEvent;
    import setBody = BodySectionNamespace.setBody;
    import setCommandButtons = CommandsSectionNamespace.setCommandButtons;
    import register = AppEventsNamespace.register;

    let newNoteButton = document.createElement("button");
    newNoteButton.appendChild(document.createTextNode("New"));
    newNoteButton.onclick = function(){
        broadcast(AppEvent.createNewNote);
    };

    let bodyFrag = document.createDocumentFragment();
    let getStarted = document.createElement("div");
    getStarted.appendChild(document.createTextNode("Get Started"));
    bodyFrag.appendChild(getStarted);

    function setBlankResultsPage(){
        setCommandButtons([newNoteButton]);
        setBody(bodyFrag);
    }

    register(AppEvent.setBlankResultsPage, setBlankResultsPage);

    //this seemly awkward useless function is called by App.ts to ensure that this search results section module is created first
    export function init(){}
}