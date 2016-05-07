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
//# sourceMappingURL=Button.js.map