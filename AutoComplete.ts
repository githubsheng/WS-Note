/// <reference path="Index.ts" />
///<reference path="AppEvents.ts"/>

namespace UIComponentNamespace {

    import broadcast = AppEventsNamespace.broadcast;
    import AppEvent = AppEventsNamespace.AppEvent;
    export function createAutoComplete() {

        let index = IndexNamespace.getIndex();

        let addSearchCriterionFunc: (keyWord: string) => void;

        function setSearchCriterionFunc(func) {
            addSearchCriterionFunc = func;
        }

        let searchEle = document.createElement("input");
        let autoCompletionListEle = document.createElement("div");
        autoCompletionListEle.id = "autoCompletionList";

        let maximumSuggestions = 20;
        let itemEles:HTMLDivElement[] = [];
        for (let i = 0; i < maximumSuggestions; i++) {
            let itemEle = document.createElement("div");
            autoCompletionListEle.appendChild(itemEle);

            itemEle.classList.add("item");
            itemEle.style.display = "none";
            itemEle.appendChild(document.createTextNode("aaa"));
            itemEles.push(itemEle);
        }

        let suggestedKeywords:string[] = [];
        let selectedSuggestionIndex = 0;
        itemEles[selectedSuggestionIndex].classList.add("selected");

        function updateItemElesOnSuggestedKeywordsChange() {
            if (suggestedKeywords.length > 0 && selectedSuggestionIndex > 0) {
                itemEles[selectedSuggestionIndex].classList.remove("selected");
                selectedSuggestionIndex = 0;
                itemEles[selectedSuggestionIndex].classList.add("selected");
            }

            for (let i = 0; i < maximumSuggestions; i++) {
                if (i < suggestedKeywords.length) {
                    itemEles[i].firstChild.nodeValue = suggestedKeywords[i];
                    itemEles[i].style.display = "block";
                } else {
                    itemEles[i].style.display = "none";
                }
            }
        }

        searchEle.addEventListener("input", function () {
            if(searchEle.value.trim() === "") {
                suggestedKeywords = [];
            } else {
                suggestedKeywords = index.keysWithPrefix(searchEle.value);
            }
            updateItemElesOnSuggestedKeywordsChange();
        });

        const keyCodeForEnter = 13;
        const keyCodeForTab = 9;
        const keyCodeForDown = 40;
        const keyCodeForUp = 38;

        searchEle.addEventListener("keyup", function (evt:KeyboardEvent) {

            if (evt.keyCode === keyCodeForDown) {

                if (selectedSuggestionIndex + 1 < suggestedKeywords.length) {
                    itemEles[selectedSuggestionIndex].classList.remove("selected");
                    selectedSuggestionIndex++;
                    itemEles[selectedSuggestionIndex].classList.add("selected");
                }

            } else if (evt.keyCode === keyCodeForUp) {

                if (selectedSuggestionIndex > 0) {
                    itemEles[selectedSuggestionIndex].classList.remove("selected");
                    selectedSuggestionIndex--;
                    itemEles[selectedSuggestionIndex].classList.add("selected");
                }

            } else if (evt.keyCode === keyCodeForEnter && suggestedKeywords.length > 0) {

                let selectedKeyword = suggestedKeywords[selectedSuggestionIndex];
                suggestedKeywords = [];
                updateItemElesOnSuggestedKeywordsChange();

                addSearchCriterionFunc(selectedKeyword);
                searchEle.value = "";

            }

        });

        searchEle.addEventListener("keydown", function (evt:KeyboardEvent) {

            if (evt.keyCode === keyCodeForDown || evt.keyCode === keyCodeForUp)
                evt.preventDefault();

            if (evt.keyCode === keyCodeForTab && suggestedKeywords.length > 0) {
                evt.preventDefault();
                searchEle.value = suggestedKeywords[selectedSuggestionIndex];
            }

        });



        return {
            searchEle: searchEle,
            autoCompletionListEle: autoCompletionListEle,
            setSearchCriterionFunc: setSearchCriterionFunc
        };
    }

    export function createCriterionSection(){
        let criteriaEle = document.createElement("div");
        criteriaEle.classList.add("criteria");
        criteriaEle.id = "searchCriteria";

        const rightShiftProp = Symbol("rightShiftProp");

        let keyWords: Set<string> = new Set();

        function addNewSearchCriterion(keyword:string) {

            if(keyWords.has(keyword)) return;
            keyWords.add(keyword);

            let criterionEle = document.createElement("span");
            criterionEle.appendChild(document.createTextNode(keyword));
            criterionEle["wsnote-keyWord"] = keyword;

            let existingCriterionEles = criteriaEle.children;

            const rightMargin = 5;
            let rightShiftDistance = 0;
            for (let i = 0; i < existingCriterionEles.length; i++) {
                rightShiftDistance += existingCriterionEles[i].getBoundingClientRect().width;
                rightShiftDistance += rightMargin;
            }

            criteriaEle.appendChild(criterionEle);

            window.setTimeout(function () {
                criterionEle.style.transform = "translateX(" + rightShiftDistance + "px)";
                criterionEle[rightShiftProp] = rightShiftDistance;
            }, 0);

            criterionEle.addEventListener("click", function(){
                let width = criterionEle.getBoundingClientRect().width;
                let i:HTMLSpanElement = criterionEle;
                while (i.nextSibling) {
                    let sibling:HTMLSpanElement = <HTMLSpanElement>i.nextSibling;
                    sibling[rightShiftProp] -= (width + rightMargin);
                    sibling.style.transform = "translateX(" + sibling[rightShiftProp] + "px)";
                    i = sibling;
                }
                criterionEle.remove();
                let keyWord = criterionEle["wsnote-keyWord"];
                keyWords.delete(keyWord);
                broadcast(AppEvent.resultsPage, keyWords);
            });

            broadcast(AppEvent.resultsPage, keyWords);
        }

        function clearAllSearchCriterion(){
            keyWords.clear();
            while(criteriaEle.firstChild) criteriaEle.removeChild(criteriaEle.firstChild);
        }

        return {
            containerEle: criteriaEle,
            addNewSearchCriterion: addNewSearchCriterion,
            clearAllSearchCriterion: clearAllSearchCriterion
        }
    }

}

