/**
 * Created by wangsheng on 9/5/16.
 */

/// <reference path="typings/chrome/chrome-app.d.ts" />

chrome.app.runtime.onLaunched.addListener(function(){

    chrome.app.window.create("test/test.html", {
        id: 'app',
        bounds: { width: 800, height: 1000 }
    })

});