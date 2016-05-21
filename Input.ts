namespace UIComponentNamespace {

    export class MaterialInput {

        public containerEle:HTMLDivElement;
        public labelEle:HTMLLabelElement;
        public inputEle:HTMLInputElement;
        private valueChangeListener: (value: string, evt?:Event) => void;

        constructor(label: string) {
            this.containerEle = document.createElement("div");
            let containerEle = this.containerEle;
            containerEle.classList.add("material");
            containerEle.classList.add("mInput");

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

        getValue(): string{
            return this.inputEle.value;
        }

        addValueChangeListener(listener: (value: string) => void) {
            this.valueChangeListener = listener;
        }

    }

}

