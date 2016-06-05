/// <reference path="typings/chrome/chrome-app.d.ts" />

chrome.app.runtime.onLaunched.addListener(function(){

    chrome.app.window.create("App.html", {
        id: 'app',
        bounds: { width: 800, height: 1000 }
    });

});