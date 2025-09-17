export interface ICoqDocumentConstructor {
    new(content: string, filename: string);
}

export class CoqDocument {
    uri : string;
    version : number;
    content_type : 'plain' | 'markdown';
    isDirty : boolean;

    filename : string;
    content : string;

    entryButton : HTMLButtonElement;
    
    // isUntitled: boolean;
    // isClosed: boolean;
    // coq?: CoqWorker;
    // onCursorUpdate: (uri: string, offset : number) => void;

    constructor(content: string, filename: string) {
        this.content = content;
        this.filename = filename;
        this.content_type = 'markdown'; // ***TODO doc options ?
        this.version = 0;
    }

    update(value: string) {
        this.version++;
        this.content = value;
    }

    save() {
        //
    }

    delete() {
        this.entryButton && this.entryButton.remove();
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

function getElemValue(eId: string): string {
    var area : HTMLTextAreaElement = document.getElementById(eId) as HTMLTextAreaElement;
    if (! (area instanceof HTMLTextAreaElement)) {
        // ***TODO 'ide-wrapper' (default value for elems) + 'editors' for cm5 editor HTMLElement 
        if (eId === 'ide-wrapper' || eId === 'editors') return null;
        throw new Error(`not implemented: '${eId}' must be a textarea`);
        // console.error(`not implemented: '${eId}' must be a textarea`);
        // return null;
    }
    area.style.display = 'none';
    return area.value;
}

export function initDocument(eIds: string[], CoqDocument: ICoqDocumentConstructor, content_type: string) {
    const extension = (content_type === 'plain') ? '.v' : '.mv';
    // from textarea
    let values: string[] = (eIds) ? eIds.map((e) => getElemValue(e)) : [];
    values = values.filter((v) => v !== null);
    if (values.length) {
        return new CoqDocument(values.join('\n'), "fromTextarea" + extension);
    }
    return new CoqDocument("", "untitled1" + extension);
}