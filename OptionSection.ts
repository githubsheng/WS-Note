/**
 * Created by wangsheng on 7/5/16.
 */

/// <reference path="Button.ts" />

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