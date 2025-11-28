import { CoqDocument, initDocuments } from "./coq-document";
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
            initDocuments(manager, elems).then((docs) => {
                this.documents = docs;
                // ***TODO
                this.manager.doc_manager.documents = this.documents;
                if (this.manager.doc_manager instanceof CoqDocumentManager) {
                    this.setDocs = this.manager.doc_manager.setDocs;
                }
                // update DocumentManagerComponent
                if (this.setDocs) // ***TODO
                    this.setDocs(() => [...docs]);
                // open first document
                let tab_manager = this.manager.tab_manager;
                if (this.documents.length > 0 && !tab_manager.current_tab) {
                    tab_manager.setCurrent(tab_manager.createTab(this.documents[0]));
                }
            });
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
            this.setDocs((docs) => [...docs, doc]);
        return true;
    }

    deleteDocument(doc: CoqDocument) {
        this.documents = this.documents.filter((d) => d !== doc);
        if (this.setDocs) // ***TODO
            this.setDocs((docs) => 
                [...docs.filter((d) => d.filename !== doc.filename)]);
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
