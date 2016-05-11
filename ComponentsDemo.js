/**
 * Created by wangsheng on 11/5/16.
 */
function runGenerator(genFunc) {
    let iterator = genFunc();
    let result;
    function iterate(value) {
        result = iterator.next(value);
        if (!result.done) {
            if (result.value instanceof Promise) {
                result.value.then(iterate);
            }
            else {
                iterate(result.value);
            }
        }
    }
    iterate();
}
class MaterialInput {
    constructor(label, id) {
        this.containerEle = document.createElement("div");
        let containerEle = this.containerEle;
        containerEle.classList.add("material");
        containerEle.classList.add("mInput");
        if (id)
            containerEle.id = id;
        this.labelEle = document.createElement("label");
        let labelEle = this.labelEle;
        containerEle.appendChild(labelEle);
        labelEle.innerText = label;
        this.inputEle = document.createElement("input");
        let inputEle = this.inputEle;
        containerEle.appendChild(inputEle);
        inputEle.addEventListener("focus", function () {
            labelEle.classList.add("focus");
        });
        inputEle.addEventListener("change", (evt) => {
            let value = inputEle.value;
            if (!value) {
                labelEle.classList.remove("hasValue");
            }
            else {
                labelEle.classList.add("hasValue");
            }
            if (this.valueChangeListener !== undefined) {
                this.valueChangeListener(value, evt);
            }
        });
        inputEle.addEventListener("blur", function () {
            labelEle.classList.remove("focus");
        });
    }
    addValueChangeListener(listener) {
        this.valueChangeListener = listener;
    }
}
/**
 * Created by wangsheng on 6/5/16.
 */
class MaterialRoundButton {
    constructor(fontAwesomeClassName) {
        const transitionDurationInMS = 500;
        this.containerEle = document.createElement("div");
        this.containerEle.classList.add("material");
        this.containerEle.classList.add("roundButton");
        let positionRef = document.createElement("div");
        this.containerEle.appendChild(positionRef);
        positionRef.classList.add("positionRef");
        this.buttonEle = document.createElement("div");
        let buttonEle = this.buttonEle;
        positionRef.appendChild(buttonEle);
        buttonEle.classList.add("button");
        let icon = document.createElement("i");
        buttonEle.appendChild(icon);
        icon.className = fontAwesomeClassName;
        let rippleEle = document.createElement("div");
        positionRef.insertBefore(rippleEle, buttonEle);
        rippleEle.classList.add("ripple");
        let isAnimationPlaying = false;
        let mouseDownMouseUpPair = 0;
        buttonEle.addEventListener("mousedown", (evt) => {
            if (!isAnimationPlaying) {
                isAnimationPlaying = true;
                mouseDownMouseUpPair++;
                rippleEle.classList.add("mousedown");
                if (this.mouseDownEventHandler)
                    this.mouseDownEventHandler(evt);
            }
        });
        buttonEle.addEventListener("mouseup", (evt) => {
            if (mouseDownMouseUpPair === 1) {
                mouseDownMouseUpPair--;
                rippleEle.classList.add("mouseup");
                if (this.mouseUpEventHandler)
                    this.mouseUpEventHandler(evt);
                window.setTimeout(() => {
                    rippleEle.remove();
                    rippleEle = document.createElement("div");
                    positionRef.insertBefore(rippleEle, buttonEle);
                    rippleEle.classList.add("ripple");
                    isAnimationPlaying = false;
                }, transitionDurationInMS);
            }
        });
    }
    addMouseDownEventHandler(handler) {
        this.mouseDownEventHandler = handler;
    }
    addMouseUpEventHandler(handler) {
        this.mouseUpEventHandler = handler;
    }
}
/**
 * Created by wangsheng on 7/5/16.
 */
/// <reference path="Button.ts" />
function createOptionsSection() {
    let optionsSection = document.createElement("div");
    optionsSection.classList.add("optionsSection");
    let optionsButton = new MaterialRoundButton("fa fa-plus");
    optionsButton.addMouseDownEventHandler(function () {
        optionsButton.buttonEle.classList.toggle("rotate");
        optionsSection.classList.toggle("expand");
    });
    optionsButton.containerEle.classList.add("optionsButton");
    optionsSection.appendChild(optionsButton.containerEle);
    let editButton = new MaterialRoundButton("fa fa-pencil");
    editButton.containerEle.classList.add("editButton");
    editButton.containerEle.classList.add("actionButton");
    optionsSection.appendChild(editButton.containerEle);
    let imageButton = new MaterialRoundButton("fa fa-file-image-o");
    imageButton.containerEle.classList.add("imageButton");
    imageButton.containerEle.classList.add("actionButton");
    optionsSection.appendChild(imageButton.containerEle);
    let paintButton = new MaterialRoundButton("fa fa-paint-brush");
    paintButton.containerEle.classList.add("paintButton");
    paintButton.containerEle.classList.add("actionButton");
    optionsSection.appendChild(paintButton.containerEle);
    let trashButton = new MaterialRoundButton("fa fa-trash");
    trashButton.containerEle.classList.add("trashButton");
    trashButton.containerEle.classList.add("actionButton");
    optionsSection.appendChild(trashButton.containerEle);
    return optionsSection;
}
/**
 * Created by wangsheng on 7/5/16.
 */
class Note {
    constructor(createdWhen, modifiedWhen) {
        this.createdWhen = createdWhen;
        this.modifiedWhen = modifiedWhen;
    }
}
/**
 * Created by wangsheng on 7/5/16.
 */
/// <reference path="Note.ts" />
class Index {
    suggestKeyword(prefix) {
        let end = getRandomInt(0, 10);
        return dummySuggestions.slice(0, end);
    }
    findNotes(keyword) {
        return [];
    }
    linkKeywordToNote(keyword, note) {
    }
    unlinkKeywordFromNote(keyword, note) {
    }
}
let index;
let dummySuggestions = ["hello", "there", "how you", "function", "switch case", "if else", "array length", "number", "linked list", "hash map"];
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
function getIndex() {
    if (!index) {
        index = new Index();
        return index;
    }
    else {
        return index;
    }
}
/**
 * Created by wangsheng on 7/5/16.
 */
/// <reference path="Index.ts" />
function createAutoComplete() {
    let index = getIndex();
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
    let itemEles = [];
    for (let i = 0; i < maximumSuggestions; i++) {
        let itemEle = document.createElement("div");
        autoCompletionListEle.appendChild(itemEle);
        itemEle.classList.add("item");
        itemEle.style.display = "none";
        itemEle.appendChild(document.createTextNode("aaa"));
        itemEles.push(itemEle);
    }
    let suggestedKeywords = [];
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
            }
            else {
                itemEles[i].style.display = "none";
            }
        }
    }
    searchEle.addEventListener("input", function () {
        suggestedKeywords = index.suggestKeyword(searchEle.value);
        updateItemElesOnSuggestedKeywordsChange();
    });
    const rightShiftProp = Symbol("rightShiftProp");
    function addNewSearchCriterion(keyword) {
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
        criterionEle.addEventListener("click", function () {
            let width = criterionEle.getBoundingClientRect().width;
            let i = criterionEle;
            while (i.nextSibling) {
                let sibling = i.nextSibling;
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
    searchEle.addEventListener("keyup", function (evt) {
        if (evt.keyCode === keyCodeForDown) {
            if (selectedSuggestionIndex + 1 < suggestedKeywords.length) {
                itemEles[selectedSuggestionIndex].classList.remove("selected");
                selectedSuggestionIndex++;
                itemEles[selectedSuggestionIndex].classList.add("selected");
            }
        }
        else if (evt.keyCode === keyCodeForUp) {
            if (selectedSuggestionIndex > 0) {
                itemEles[selectedSuggestionIndex].classList.remove("selected");
                selectedSuggestionIndex--;
                itemEles[selectedSuggestionIndex].classList.add("selected");
            }
        }
        else if (evt.keyCode === keyCodeForEnter && suggestedKeywords.length > 0) {
            let selectedKeyword = suggestedKeywords[selectedSuggestionIndex];
            suggestedKeywords = [];
            updateItemElesOnSuggestedKeywordsChange();
            addNewSearchCriterion(selectedKeyword);
            searchEle.value = "";
        }
    });
    searchEle.addEventListener("keydown", function (evt) {
        if (evt.keyCode === keyCodeForDown || evt.keyCode === keyCodeForUp)
            evt.preventDefault();
        if (evt.keyCode === keyCodeForTab && suggestedKeywords.length > 0) {
            evt.preventDefault();
            searchEle.value = suggestedKeywords[selectedSuggestionIndex];
        }
    });
    return autoCompletionEle;
}
/// <reference path="Note.ts" />
const dbName = "test";
const noteStoreName = "notes";
function connectToDB() {
    function promiseFunc(resolve) {
        //get idb factory
        let dbFactory = window.indexedDB;
        //use idb factory to connect to db called `test`. the function call immediately returns the request that is sent to
        //connect to db. When the connection is successful, the request's onsuccess/onerror call back will be invoked.
        let request = dbFactory.open(dbName);
        //when the connection is successful this call back is invoked.
        //note that if onupgradeneeded is invoked, it is called before onsuccess.
        request.onsuccess = function (evt) {
            //once connection is successful, database is available as the `result` of IDBOpenDBRequest. store this to a global
            //variable for reuse later. this connection will be closed automatically when you leave the page.
            let idb = request.result;
            resolve(idb);
        };
        //if this connection fails, this call back is invoked.
        request.onerror = function () {
            throw new Error("an error has occurred when connecting to indexdedDB");
        };
        //if I connect to a database that does not exist, it will be created, when it is created, this call back will be invoked,
        //this is where i define the database schema, such as objectStore, index, id and so on.
        //this call back is also invoked when i upgrade the database. Check out IDBFactory::open
        //notice if this call back get invoked, it is invoked before onsuccess.
        request.onupgradeneeded = function (evt) {
            //when the callback is invoked, database is available as IDBOpenDBRequest.result
            let idb = request.result;
            if (idb.objectStoreNames.contains(noteStoreName))
                idb.deleteObjectStore(noteStoreName);
            let store = idb.createObjectStore(noteStoreName, { keyPath: 'id', autoIncrement: true });
            store.createIndex('title', 'title', { unique: true, multiEntry: false });
        };
    }
    return new Promise(promiseFunc);
}
function iterateAllNotes(idb, noteProcessor) {
    function promiseFunc(resolve) {
        let transaction = idb.transaction(noteStoreName, "readonly");
        let objectStore = transaction.objectStore(noteStoreName);
        let request = objectStore.openCursor();
        request.onsuccess = function () {
            let cursor = request.result;
            if (cursor) {
                noteProcessor(cursor.value);
                cursor.continue();
            }
            else {
                resolve();
            }
        };
    }
    return new Promise(promiseFunc);
}
function addNote(idb, note) {
    function promiseFunc(resolve) {
        var transaction = idb.transaction(noteStoreName, 'readwrite');
        var store = transaction.objectStore(noteStoreName);
        var request = store.add(note);
        request.onsuccess = function () {
            resolve(request.result);
        };
    }
    return new Promise(promiseFunc);
}
///<reference path="AsyncUtil.ts"/>
///<reference path="Input.ts" />
///<reference path="OptionSection.ts" />
///<reference path="AutoComplete.ts" />
///<reference path="Storage.ts"/>
let usernameInput = new MaterialInput("Username", "username-input");
document.body.appendChild(usernameInput.containerEle);
usernameInput.addValueChangeListener(function (value) {
    console.log(value);
});
document.body.appendChild(createAutoComplete());
document.body.appendChild(createOptionsSection());
function* testStorage() {
    let idb = yield connectToDB();
    console.log("getting database");
    yield iterateAllNotes(idb, function (note) {
        console.log(note);
    });
    console.log("done iterating all notes");
    let id = yield addNote(idb, new Note(1, 1));
    console.log("id of the new entity is " + id);
}
runGenerator(testStorage);
