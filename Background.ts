/// <reference path="typings/chrome/chrome-app.d.ts" />

chrome.app.runtime.onLaunched.addListener(function(){

    chrome.app.window.create("test/html/app.html", {
        id: 'app',
        bounds: { width: 800, height: 1000 }
    });

});