namespace FooterSectionNamespace {

    let footer: HTMLDivElement = <HTMLDivElement>document.querySelector("#footer");

    export function setHint(hint: string) {
        footer.innerText = hint;
    }

}