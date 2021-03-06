namespace AppEventsNamespace {

    export enum AppEvent {
        createNewNote, viewNote, editNote, resultsPage, viewManual,
        cancelUploadImage, imgFocus, imgLoseFocus, incImgWidth, decImgWidth, incImgHeight, decImgHeight, incImgSize, decImgSize, drawOnImg
    }

    let eventListenerMap: Map<AppEvent, Array<(data? : any) => void>> = new Map();

    export function register(event: AppEvent, func: (data? : any) => void) {
        if(eventListenerMap.get(event) === undefined) eventListenerMap.set(event, []);
        eventListenerMap.get(event).push(func);
    }

    export function broadcast(event: AppEvent, data?: any) {
        let listeners = eventListenerMap.get(event);
        if(listeners !== undefined) {
            for(let listener of listeners)
                listener(data);
        }
    }

}