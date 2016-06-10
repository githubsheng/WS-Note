///<reference path="typings/chrome/chrome-app.d.ts"/>

namespace PreviewWindowNamespace {
    import AppWindow = chrome.app.window.AppWindow;

    let previewWindow: Window;

    export function closePreviewWindow(){
        if(previewWindow) {
            previewWindow.close();
        }
    }

    export function getPreviewWindow(): Promise<Window>{
        if(!previewWindow || previewWindow.closed) {
            if(chrome && chrome.app && chrome.app.window) {
                chrome.app.window.create('Preview.html', {
                    'bounds': {
                        'width': 400,
                        'height': 400
                    }
                }, function(appWindow: AppWindow) {
                    previewWindow = appWindow.contentWindow;
                });
            } else {
                previewWindow = window.open("Preview.html");
            }
            return new Promise<Window>(function(resolve){
                previewWindow.onload = function(){
                    resolve(previewWindow);
                };
            })
        } else {
            return Promise.resolve(previewWindow);
        }
    }
}

