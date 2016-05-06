/**
 * Created by wangsheng on 6/5/16.
 */

class MaterialInput {

    public containerEle:HTMLDivElement;
    public labelEle:HTMLLabelElement;
    public inputEle:HTMLInputElement;
    private valueChangeListener: (value: string, evt?:Event) => void;

    constructor(label: string, id?: string) {
        this.containerEle = document.createElement("div");
        let containerEle = this.containerEle;
        containerEle.classList.add("material");
        containerEle.classList.add("mInput");

        if(id) containerEle.id = id;

        this.labelEle = document.createElement("label");
        let labelEle = this.labelEle;

        containerEle.appendChild(labelEle);
        labelEle.innerText = label;

        this.inputEle = document.createElement("input");
        let inputEle = this.inputEle;

        containerEle.appendChild(inputEle);

        inputEle.addEventListener("focus", function(){
            labelEle.classList.add("focus");
        });

        inputEle.addEventListener("change", (evt:Event) => {
            let value = inputEle.value;

            if(!value) {
                labelEle.classList.remove("hasValue");
            } else {
                labelEle.classList.add("hasValue");
            }

            if(this.valueChangeListener !== undefined) {
                this.valueChangeListener(value, evt);
            }
        });

        inputEle.addEventListener("blur", function(){
            labelEle.classList.remove("focus");
        });
    }

    addValueChangeListener(listener: (value: string) => void) {
        this.valueChangeListener = listener;
    }

}


class MaterialRoundButton {
    public containerEle: HTMLDivElement;
    public buttonEle: HTMLDivElement;
    private mouseDownEventHandler:(evt:MouseEvent) => void;
    private mouseUpEventHandler:(evt:MouseEvent) => void;

    constructor(fontAwesomeClassName: string) {
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

        buttonEle.addEventListener("mousedown", (evt:MouseEvent) => {
            if(!isAnimationPlaying) {
                isAnimationPlaying = true;
                mouseDownMouseUpPair++;
                rippleEle.classList.add("mousedown");
                if(this.mouseDownEventHandler) this.mouseDownEventHandler(evt);
            }
        });

        buttonEle.addEventListener("mouseup", (evt:MouseEvent) => {
            if(mouseDownMouseUpPair === 1) {
                mouseDownMouseUpPair--;
                rippleEle.classList.add("mouseup");

                if(this.mouseUpEventHandler) this.mouseUpEventHandler(evt);

                window.setTimeout(()=>{
                    rippleEle.remove();
                    rippleEle = document.createElement("div");
                    positionRef.insertBefore(rippleEle, buttonEle);
                    rippleEle.classList.add("ripple");
                    isAnimationPlaying = false;
                }, transitionDurationInMS);
            }
        });
    }

    addMouseDownEventHandler(handler: (evt:MouseEvent)=> void){
        this.mouseDownEventHandler = handler;
    };

    addMouseUpEventHandler(handler: (evt:MouseEvent) => void) {
        this.mouseUpEventHandler = handler;
    };
}

function createOptionsSection(parentContainer:HTMLDivElement | HTMLBodyElement){

    let optionsSection = document.createElement("div");
    optionsSection.classList.add("optionsSection");
    parentContainer.appendChild(optionsSection);

    let optionsButton = new MaterialRoundButton("fa fa-plus");

    optionsButton.addMouseDownEventHandler(function(){
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

}

let usernameInput = new MaterialInput("Username", "username-input");
document.body.appendChild(usernameInput.containerEle);

usernameInput.addValueChangeListener(function(value: string){
    console.log(value);
});


createOptionsSection(<HTMLBodyElement>document.body);