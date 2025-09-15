
export class CoqDocument {
    uri : string;
    version : number;
    content_type : 'plain' | 'markdown';
    isDirty : boolean;

    // File?
    filename : string;
    content : string;
    
    // isUntitled: boolean;
    // isClosed: boolean;
    // coq?: CoqWorker;
    // onCursorUpdate: (uri: string, offset : number) => void;

    constructor(content: string, filename: string) {
        this.content = content;
        this.filename = filename;
    }

    create(/*  */) {
        // constructor ?
    }

    update(value: string) {
        this.content = value;
    }

    save() {
        //
    }

    getFilename() {
        return this.filename;
    }

    getValue() {
        return this.content;
    }

    getContentType() {
        return this.content_type;
    }

}