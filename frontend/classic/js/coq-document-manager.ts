import { CoqDocument, initDocument } from "./coq-document";
import { CoqManager } from "./coq-manager";
import { initDocumentManagerComponent } from "./DocumentManagerComponent"

export class CoqDocumentManager {

    documents: CoqDocument[];
    manager: CoqManager;
    container_id: string;
    setDocs: any;

    constructor(manager: CoqManager, elems: string[]) {
        this.manager = manager;
        this.documents = [];
        let doc = initDocument(manager, elems);
        this.documents.push(doc);
        if (manager.options.multiple_editors) {
            this.container_id = 'documents';
            initDocumentManagerComponent(this);
        }
    }

    createDocument(content: string, filename: string) {
        const CoqDocument = this.manager.getDocumentConstructor();
        const doc = new CoqDocument(content, filename, this.manager.options.content_type);
        this.documents.push(doc);
        if (this.setDocs) // ***TODO
            this.setDocs([...this.documents]);
    }

    deleteDocument(doc: CoqDocument) {
        this.documents = this.documents.filter((d) => d !== doc);
        if (this.setDocs) // ***TODO
            this.setDocs([...this.documents]);
        this.manager.tab_manager.closeTabWithDoc(doc);
        doc.delete();
    }

    deleteAllDocuments() {
        for (const doc of this.documents)
            doc.delete();
        this.documents.splice(0);
        this.manager.tab_manager.closeAll();
    }
}