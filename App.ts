///<reference path="AutoComplete.ts"/>
///<reference path="AsyncUtil.ts"/>
///<reference path="IndexAndCacheBuilder.ts"/>
///<reference path="AppEvents.ts"/>
///<reference path="SearchResultSection.ts"/>
///<reference path="EVNoteSection.ts"/>

namespace AppNamespace {

    import createAutoComplete = UIComponentNamespace.createAutoComplete;
    import createCriterionSection = UIComponentNamespace.createCriterionSection;
    import buildIndexAndCache = IndexAndCacheBuilderNamespace.buildIndexAndCache;
    import r = Utility.r;
    import broadcast = AppEventsNamespace.broadcast;
    import AppEvent = AppEventsNamespace.AppEvent;

    let auto = createAutoComplete();
    let newNoteButton = document.createElement("button");
    newNoteButton.appendChild(document.createTextNode("New"));

    newNoteButton.onclick = function () {
        broadcast(AppEvent.createNewNote);
    };

    let headerLeft = document.querySelector("#headerLeft");
    headerLeft.appendChild(auto.searchEle);
    headerLeft.appendChild(newNoteButton);
    document.body.appendChild(auto.autoCompletionListEle);

    let criteriaSection = createCriterionSection();
    document.body.appendChild(criteriaSection.containerEle);
    auto.setSearchCriterionFunc(criteriaSection.addNewSearchCriterion);

    SearchResultSectionNamespace.init();
    EVNoteSectionNamespace.init();

    r(function*(){
        yield* buildIndexAndCache();
        document.body.removeChild(document.querySelector("#appLogo"));
        broadcast(AppEvent.resultsPage);
    });

    var index = IndexNamespace.getIndex();
    index.putAsSearchKeyword("apple", false, 1);
    index.putAsSearchKeyword("application", false, 1);
    index.putAsSearchKeyword("apply", false, 1);
    index.putAsSearchKeyword("ape", false, 1);
    index.putAsSearchKeyword("ace", false, 1);
    index.putAsSearchKeyword("a kind man", false, 1);

}
