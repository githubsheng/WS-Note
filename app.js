var MaterialInput = (function () {
    function MaterialInput(label, id) {
        var _this = this;
        this.containerEle = document.createElement("div");
        var containerEle = this.containerEle;
        containerEle.classList.add("material");
        containerEle.classList.add("mInput");
        if (id)
            containerEle.id = id;
        this.labelEle = document.createElement("label");
        var labelEle = this.labelEle;
        containerEle.appendChild(labelEle);
        labelEle.innerText = label;
        this.inputEle = document.createElement("input");
        var inputEle = this.inputEle;
        containerEle.appendChild(inputEle);
        inputEle.addEventListener("focus", function () {
            labelEle.classList.add("focus");
        });
        inputEle.addEventListener("change", function (evt) {
            var value = inputEle.value;
            if (!value) {
                labelEle.classList.remove("hasValue");
            }
            else {
                labelEle.classList.add("hasValue");
            }
            if (_this.valueChangeListener !== undefined) {
                _this.valueChangeListener(value, evt);
            }
        });
        inputEle.addEventListener("blur", function () {
            labelEle.classList.remove("focus");
        });
    }
    MaterialInput.prototype.addValueChangeListener = function (listener) {
        this.valueChangeListener = listener;
    };
    return MaterialInput;
}());
/**
 * Created by wangsheng on 6/5/16.
 */
var MaterialRoundButton = (function () {
    function MaterialRoundButton(fontAwesomeClassName) {
        var _this = this;
        var transitionDurationInMS = 500;
        this.containerEle = document.createElement("div");
        this.containerEle.classList.add("material");
        this.containerEle.classList.add("roundButton");
        var positionRef = document.createElement("div");
        this.containerEle.appendChild(positionRef);
        positionRef.classList.add("positionRef");
        this.buttonEle = document.createElement("div");
        var buttonEle = this.buttonEle;
        positionRef.appendChild(buttonEle);
        buttonEle.classList.add("button");
        var icon = document.createElement("i");
        buttonEle.appendChild(icon);
        icon.className = fontAwesomeClassName;
        var rippleEle = document.createElement("div");
        positionRef.insertBefore(rippleEle, buttonEle);
        rippleEle.classList.add("ripple");
        var isAnimationPlaying = false;
        var mouseDownMouseUpPair = 0;
        buttonEle.addEventListener("mousedown", function (evt) {
            if (!isAnimationPlaying) {
                isAnimationPlaying = true;
                mouseDownMouseUpPair++;
                rippleEle.classList.add("mousedown");
                if (_this.mouseDownEventHandler)
                    _this.mouseDownEventHandler(evt);
            }
        });
        buttonEle.addEventListener("mouseup", function (evt) {
            if (mouseDownMouseUpPair === 1) {
                mouseDownMouseUpPair--;
                rippleEle.classList.add("mouseup");
                if (_this.mouseUpEventHandler)
                    _this.mouseUpEventHandler(evt);
                window.setTimeout(function () {
                    rippleEle.remove();
                    rippleEle = document.createElement("div");
                    positionRef.insertBefore(rippleEle, buttonEle);
                    rippleEle.classList.add("ripple");
                    isAnimationPlaying = false;
                }, transitionDurationInMS);
            }
        });
    }
    MaterialRoundButton.prototype.addMouseDownEventHandler = function (handler) {
        this.mouseDownEventHandler = handler;
    };
    MaterialRoundButton.prototype.addMouseUpEventHandler = function (handler) {
        this.mouseUpEventHandler = handler;
    };
    return MaterialRoundButton;
}());
/**
 * Created by wangsheng on 7/5/16.
 */
/// <reference path="Button.ts" />
function createOptionsSection(parentContainer) {
    var optionsSection = document.createElement("div");
    optionsSection.classList.add("optionsSection");
    parentContainer.appendChild(optionsSection);
    var optionsButton = new MaterialRoundButton("fa fa-plus");
    optionsButton.addMouseDownEventHandler(function () {
        optionsButton.buttonEle.classList.toggle("rotate");
        optionsSection.classList.toggle("expand");
    });
    optionsButton.containerEle.classList.add("optionsButton");
    optionsSection.appendChild(optionsButton.containerEle);
    var editButton = new MaterialRoundButton("fa fa-pencil");
    editButton.containerEle.classList.add("editButton");
    editButton.containerEle.classList.add("actionButton");
    optionsSection.appendChild(editButton.containerEle);
    var imageButton = new MaterialRoundButton("fa fa-file-image-o");
    imageButton.containerEle.classList.add("imageButton");
    imageButton.containerEle.classList.add("actionButton");
    optionsSection.appendChild(imageButton.containerEle);
    var paintButton = new MaterialRoundButton("fa fa-paint-brush");
    paintButton.containerEle.classList.add("paintButton");
    paintButton.containerEle.classList.add("actionButton");
    optionsSection.appendChild(paintButton.containerEle);
    var trashButton = new MaterialRoundButton("fa fa-trash");
    trashButton.containerEle.classList.add("trashButton");
    trashButton.containerEle.classList.add("actionButton");
    optionsSection.appendChild(trashButton.containerEle);
}
/**
 * Created by wangsheng on 7/5/16.
 */
/// <reference path="Input.ts" />
/// <reference path="OptionSection.ts" />
var usernameInput = new MaterialInput("Username", "username-input");
document.body.appendChild(usernameInput.containerEle);
usernameInput.addValueChangeListener(function (value) {
    console.log(value);
});
createOptionsSection(document.body);
