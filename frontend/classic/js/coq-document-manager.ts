import { CoqDocument, initDocument } from "./coq-document";
import { CoqManager } from "./coq-manager";

export interface ICoqDocumentManager {
    documents: CoqDocument[];
    manager: CoqManager;
    container_id: string;
    createDocument(content: string, filename: string): boolean;
    deleteDocument(doc: CoqDocument): void;
    ifFilenameExists(filename: string): boolean;
}

export class CoqDocumentManager implements ICoqDocumentManager {

    documents: CoqDocument[];
    manager: CoqManager;
    container_id: string;
    setDocs: any; // ***TODO

    constructor(manager: CoqManager, elems: string[] | CoqDocument[]) {
        this.manager = manager;
        this.documents = [];
        if (elems.every((e) => e instanceof CoqDocument)) {
            this.documents = elems;
        } else {
            const doc = initDocument(manager, elems);
            this.documents.push(doc);
        }
        if (manager.options.multiple_editors) {
            this.container_id = 'documents';
        }
    }

    /**
     * create document and add it into document array,
     * also check if filename already exists
     * @param content document value
     * @param filename 
     * @returns true if created, false if filename already exists
     */
    createDocument(content: string, filename: string): boolean {
        if (this.ifFilenameExists(filename))
            return false;
        const CoqDocument = this.manager.getDocumentConstructor();
        const doc = new CoqDocument(content, filename);
        this.documents.push(doc);
        if (this.setDocs) // ***TODO
            this.setDocs([...this.documents]);
        return true;
    }

    deleteDocument(doc: CoqDocument) {
        this.documents = this.documents.filter((d) => d !== doc);
        if (this.setDocs) // ***TODO
            this.setDocs([...this.documents]);
        this.manager.tab_manager.closeTabWithDoc(doc);
        doc.delete();
    }

    ifFilenameExists(filename: string): boolean {
        for (const doc of this.documents)
            if (doc.filename === filename)
                return true;
        return false;
    }
}
