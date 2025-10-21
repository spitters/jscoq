import { CoqManager } from "./coq-manager";

export type content = 'plain' | 'markdown';

export interface ICoqDocumentConstructor {
    new(content: string, filename: string, content_type: content);
}

export class CoqDocument {
    protected uri : string;
    protected languageId : 'rocq' | 'markdown';
    protected version : number;
    protected filename : string;
    protected content : string;
    protected content_type : content;
    protected preprocess : (text: string) => string;

    constructor(content: string, filename: string, content_type: content) {
        this.version = 1;
        this.content_type = content_type;
        this.filename = filename;
        this.content = content;
        this.createUri();
        this.preprocess = this.getPreProcessFunc();
    }
    
    protected createUri() {
        this.uri = `file:///src/${this.filename}`;
        this.languageId = this.uri.endsWith(".v") ? "rocq" : 'markdown';
    }

    update(value: string, notify?: boolean) {
        if (value === this.content) return;
        this.version++;
        this.content = value;
        // TODO notification document modified
        if (notify) {
            //
        }
    }

    save() {}
    delete() {}

    // Setup preprocess method for markdown
    protected getPreProcessFunc() : (text : string) => string {
        // TODO For now we disable it and use instead the server logic.
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
        let wsfill = (s: string) => s.replace(/[^\n]/g, ' ');
        return text.split(/```([^]*?)```/g).map((x, i) => i & 1 ? x : wsfill(x))
                   .join('');
    }

    getUri() {
        return this.uri;
    }
    
    /// Use TS getters?
    getLanguageId() {
        return this.languageId;
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
export function initDocument(manager: CoqManager,
                             eIds: string[]) : CoqDocument {

    const extension = (manager.options.content_type === 'plain') ? '.v' : '.mv';
    const CoqDocument = manager.getDocumentConstructor();
    // from textarea
    let values: string[] = (eIds) ? eIds.map((e) => getElemValue(e)) : [];
    values = values.filter((v) => v !== null);
    let filename: string,
        content : string;
    if (values.length) {
        content = values.join('\n');
        filename = "fromTextarea" + extension;
    } else { // if no textarea
        content = "";
        filename = "untitled1" + extension;
    }
    return new CoqDocument(content, filename, manager.options.content_type);
}