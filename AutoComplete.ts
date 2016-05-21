/**
 * Created by wangsheng on 7/5/16.
 */

/// <reference path="Index.ts" />

namespace UIComponentNamespace {

    export function createAutoComplete():HTMLDivElement {

        let index = IndexNamespace.getIndex();

        let autoCompletionEle = document.createElement("div");
        autoCompletionEle.classList.add("autoCompletion");

        let criteriaEle = document.createElement("div");
        autoCompletionEle.appendChild(criteriaEle);
        criteriaEle.classList.add("criteria");

        let searchAndSuggestionsContainer = document.createElement("div");
        searchAndSuggestionsContainer.classList.add("searchAndSuggestionContainer");
        autoCompletionEle.appendChild(searchAndSuggestionsContainer);

        let searchEle = document.createElement("input");
        searchAndSuggestionsContainer.appendChild(searchEle);
        searchEle.classList.add("search");

        let autoCompletionListEle = document.createElement("div");
        searchAndSuggestionsContainer.appendChild(autoCompletionListEle);
        autoCompletionListEle.classList.add("autoCompletionList");

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

            suggestedKeywords = index.keysWithPrefix(searchEle.value);

            updateItemElesOnSuggestedKeywordsChange();

        });

        const rightShiftProp = Symbol("rightShiftProp");

        function addNewSearchCriterion(keyword:string) {

            let criterionEle = document.createElement("span");
            criterionEle.appendChild(document.createTextNode(keyword));

            let existingCriterionEles = criteriaEle.children;

            const rightMarginOfCriterionEle = 5;
            let rightShiftDistance = 0;
            for (let i = 0; i < existingCriterionEles.length; i++) {
                rightShiftDistance += existingCriterionEles[i].getBoundingClientRect().width;
                rightShiftDistance += rightMarginOfCriterionEle;
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
                    sibling[rightShiftProp] -= (width + rightMarginOfCriterionEle);
                    sibling.style.transform = "translateX(" + sibling[rightShiftProp] + "px)";
                    i = sibling;
                }
                criterionEle.remove();
            });

        }

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

                addNewSearchCriterion(selectedKeyword);
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


        return autoCompletionEle;
    }

}

