/**
 * Created by wangsheng on 7/5/16.
 */
/// <reference path="Input.ts" />
/// <reference path="OptionSection.ts" />
let usernameInput = new MaterialInput("Username", "username-input");
document.body.appendChild(usernameInput.containerEle);
usernameInput.addValueChangeListener(function (value) {
    console.log(value);
});
document.body.appendChild(createOptionsSection());
//# sourceMappingURL=Demo.js.map