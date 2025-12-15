import { CoqManager } from "./coq-manager";
import { getAllFiles } from "./indexedDB";

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
        // ***TODO 'ide-wrapper' (default value for elems) 
        if (eId === 'ide-wrapper') return null;
        throw new Error(`not implemented: '${eId}' must be a textarea`);
        // console.error(`not implemented: '${eId}' must be a textarea`);
        // return null;
    }
    area.style.display = 'none';
    return area.value;
}

async function initDocumentsFromDB(manager: CoqManager) {
    const CoqDocument = manager.getDocumentConstructor();
    let documents: CoqDocument[] = [];
    let files = await getAllFiles();
    if (files) {
        for (const [filename, content] of Object.entries(files)) {
            documents.push(new CoqDocument(content, filename))
        }
    }
    return documents;
}

/**
 * create the first document, with textarea value if exist
 * @param eIds textarea element ids
 * @param CoqDocument document constructor
 * @param content_type 
 * @returns 
 */
export async function initDocuments(manager: CoqManager,
                             eIds: string[]) {
    // ***TODO remove from textarea
    const extension = (manager.options.languageId === 'rocq') ? '.v' : '.mv';
    const CoqDocument = manager.getDocumentConstructor();
    let documents: CoqDocument[] = [];
    // from textarea
    let values: string[] = (eIds) ? eIds.map((e) => getElemValue(e)) : [];
    values = values.filter((v) => v !== null);
    if (values.length)
        documents.push(new CoqDocument(values.join('\n'), "fromTextarea" + extension));
    else // from cache
        documents = await initDocumentsFromDB(manager);
    // if nothing then create empty document
    if (documents.length === 0)
        documents.push(new CoqDocument("", "untitled" + extension))
    return documents;
}