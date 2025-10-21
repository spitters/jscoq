import { CoqManager } from "./coq-manager";

export type languageId = 'rocq' | 'markdown';

export interface ICoqDocumentConstructor {
    new(content: string, filename: string);
}

export class CoqDocument {
    protected _uri : string;
    protected _languageId : 'rocq' | 'markdown';
    protected _version : number;
    protected _filename : string;
    protected _content : string;

    constructor(content: string, filename: string) {
        this._version = 1;
        this._filename = filename;
        this._content = content;
        this.createUri();
    }
    
    protected createUri() {
        this._uri = `file:///src/${this.filename}`;
        this._languageId = this.uri.endsWith(".v") ? "rocq" : 'markdown';
    }

    update(value: string, notify?: boolean) {
        if (value === this.value) return;
        this._version++;
        this._content = value;
        // TODO notification document modified
        if (notify) {
            //
        }
    }

    save() {}
    delete() {}

    get uri() {
        return this._uri;
    }
    
    get languageId() {
        return this._languageId;
    }

    get version() {
        return this._version;
    }

    get filename() {
        return this._filename;
    }

    get value() {
        return this._content;
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

    const extension = (manager.options.languageId === 'rocq') ? '.v' : '.mv';
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
    return new CoqDocument(content, filename);
}