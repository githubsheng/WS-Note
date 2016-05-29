/**
 * Created by wangsheng on 7/5/16.
 */

    
    
class Note {

    public id:number;
    public title: string;
    public content: string;
    public createdWhen: number;
    public modifiedWhen: number;
    public tags: string[] = [];

    constructor(createdWhen: number, modifiedWhen: number) {
        this.createdWhen = createdWhen;
        this.modifiedWhen = modifiedWhen;
    }

}