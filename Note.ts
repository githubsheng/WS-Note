///<reference path="test/TestViewer.ts"/>

class Note {

    public id:number;
    public title: string;
    public content: string;
    public createdWhen: number;
    public modifiedWhen: number;
    public tags: string[] = [];
    public references: number[] = [];
    public components: Component[] = [];

    constructor(createdWhen: number, modifiedWhen: number) {
        this.createdWhen = createdWhen;
        this.modifiedWhen = modifiedWhen;
    }

}