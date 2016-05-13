/**
 * Created by wangsheng on 7/5/16.
 */

class Note {

    public id:number;
    public title: string;
    public content: string;
    public url: string;
    public createdWhen: number;
    public modifiedWhen: number;

    constructor(createdWhen: number, modifiedWhen: number) {
        this.createdWhen = createdWhen;
        this.modifiedWhen = modifiedWhen;
    }

}