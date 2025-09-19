export type content = 'plain' | 'markdown';

export interface ICoqDocumentConstructor {
    new(content: string, filename: string);
}

export class CoqDocument {
    protected uri : string;
    protected version : number;
    protected content_type : content;
    protected filename : string;
    protected content : string;
    protected preprocess : (text: string) => string;
    entryButton : HTMLButtonElement;

    // isDirty : boolean;
    // isUntitled: boolean;
    // isClosed: boolean;
    // coq?: CoqWorker;
    // onCursorUpdate: (uri: string, offset : number) => void;

    constructor(content: string, filename: string) {
        this.uri = `file:///src/${filename}`;
        this.version = 0;
        this.content_type = 'markdown'; // ***TODO from arg ? (manager.options.content_type)
        this.filename = filename;
        this.content = content;
        this.preprocess = this.getPreProcessFunc();
    }

    update(value: string) {
        this.version++;
        this.content = value;
        // TODO notification document modified
    }

    save() {
        //
    }

    delete() {
        this.entryButton && this.entryButton.remove();
    }

    // Setup preprocess method for markdown
    protected getPreProcessFunc() : (text : string) => string {
        // For now we disable it and use instead the server logic.
        let c = 'plain';
        // switch (this.content_type) {
        switch (c) {
        case 'plain':    return (x => x);
        case 'markdown': return this.markdownPreprocess;
        default:
            throw new Error(`invalid content specification: '${this.content_type}'`);
        }
    }

    /**
     * Strip off plain text, leaving the Coq text.
     * @param {string} text
     */
    protected markdownPreprocess(text: string) {
        let wsfill = s => s.replace(/[^\n]/g, ' ');
        return text.split(/```([^]*?)```/g).map((x, i) => i & 1 ? x : wsfill(x))
                   .join('');
    }

    getUri() {
        return this.uri;
    }

    getVersion() {
        return this.version;
    }

    getContentType() {
        return this.content_type;
    }

    getFilename() {
        return this.filename;
    }

    getValue() {
        return this.content;
    }
    
    getRawValue() {
        return this.preprocess(this.content);
    }
}

/**
 * given an `HTMLTextareaElement`'s id, return this element's value
 * @param eId textarea element id
 * @returns element value
 */
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

/**
 * create the first document, with textarea value if exist
 * @param eIds textarea element ids
 * @param CoqDocument document constructor
 * @param content_type 
 * @returns 
 */
export function initDocument(eIds: string[],
                             CoqDocument: ICoqDocumentConstructor,
                             content_type: content) : CoqDocument {
    
    const extension = (content_type === 'plain') ? '.v' : '.mv';
    // from textarea
    let values: string[] = (eIds) ? eIds.map((e) => getElemValue(e)) : [];
    values = values.filter((v) => v !== null);
    if (values.length)
        return new CoqDocument(values.join('\n'), "fromTextarea" + extension);
    else // if no textarea
        return new CoqDocument("", "untitled1" + extension);
}