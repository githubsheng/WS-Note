///<reference path="AutoComplete.ts"/>

namespace AppNamespace {

    import createAutoComplete = UIComponentNamespace.createAutoComplete;
    import createCriterionSection = UIComponentNamespace.createCriterionSection;

    let auto = createAutoComplete();
    let headerLeft = document.querySelector("#headerLeft");
    headerLeft.appendChild(auto.searchEle);
    document.body.appendChild(auto.autoCompletionListEle);

    let criteriaSection = createCriterionSection();
    document.body.appendChild(criteriaSection.containerEle);
    auto.setSearchCriterionFunc(criteriaSection.addNewSearchCriterion);

    var index = IndexNamespace.getIndex();
    index.putAsSearchKeyword("apple", false, 1);
    index.putAsSearchKeyword("application", false, 1);
    index.putAsSearchKeyword("apply", false, 1);
    index.putAsSearchKeyword("ape", false, 1);
    index.putAsSearchKeyword("ace", false, 1);
    index.putAsSearchKeyword("a kind man", false, 1);

}
