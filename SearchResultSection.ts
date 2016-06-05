///<reference path="AppEvents.ts"/>
///<reference path="BodySection.ts"/>
///<reference path="CommandsSection.ts"/>
///<reference path="AsyncUtil.ts"/>
///<reference path="Storage.ts"/>

namespace SearchResultSectionNamespace {

    import broadcast = AppEventsNamespace.broadcast;
    import AppEvent = AppEventsNamespace.AppEvent;
    import setBody = BodySectionNamespace.setBody;
    import setCommandButtons = CommandsSectionNamespace.setCommandButtons;
    import register = AppEventsNamespace.register;
    import r = Utility.r;
    import getIDB = StorageNamespace.getIDB;
    import iterateNotes = StorageNamespace.iterateNotes;

    let newNoteButton = document.createElement("button");
    newNoteButton.appendChild(document.createTextNode("New"));

    function showAllResults(){
        let resultLists = document.createElement("div");
        r(function*(){
            let idb = yield getIDB();
            yield iterateNotes(idb, function(note: Note){
                let item = document.createElement("div");
                item.appendChild(document.createTextNode(note.id.toString()));
                item.onclick = function() {
                    broadcast(AppEvent.viewNote, note.id);
                };
                resultLists.appendChild(item);
            });
            setCommandButtons([newNoteButton]);
            setBody(resultLists);
        })
    }

    newNoteButton.onclick = function(){
        broadcast(AppEvent.createNewNote);
    };

    register(AppEvent.resultsPage, showAllResults);

    //this seemly awkward useless function is called by App.ts to ensure that this search results section module is created first
    export function init(){}
}