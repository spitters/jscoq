import { CoqDocument } from "../../coq-document";
import { CoqDocumentManager } from "../../coq-document-manager";
import { CoqManager } from "../../coq-manager";
import { File } from "./GistComponent";

export class CoqGistDocumentManager extends CoqDocumentManager {
    /**
     * gist files respecting REST API endpoints for gists (request parameters)
     */
    private files: { [key: string]: { content: string } };
    /**
     * to remove deleted files in `files` after the update request is fulfilled,
     */
    private deleted_files: string[];

    constructor(manager: CoqManager, elems: string[] | CoqDocument[]) {
        super(manager, elems);
        this.files = {};
        this.deleted_files = [];
    }

    deleteDocument(doc: CoqDocument) {
        super.deleteDocument(doc);
        this.files[doc.filename] = null;
    };

    private deleteAllDocuments() {
        for (const doc of this.documents)
            doc.delete();
        this.documents.splice(0);
        this.manager.tab_manager.closeAll();
        this.files = {};
    }

    replaceAllDocuments(files: File[]) {
        this.deleteAllDocuments();
        for (const f of files) {
            if (!this.createDocument(f.content, f.filename)) {
                // todo error notif
            }
        }
    }

    getFiles() {
        for (const fn in this.files) {
            if (this.files[fn] === null && !this.deleted_files.includes(fn))
                this.deleted_files.push(fn);
        }
        for (const doc of this.documents) {
            this.files[doc.filename] = { content: doc.value };
        }
        return this.files;
    }

    removeDeletedFiles() {
        const length = this.deleted_files.length;
        for (let i = 0; i < length; i++) {
            let fn = this.deleted_files.pop();
            if (this.files[fn] === null) {
                delete this.files[fn];
            }
        }
    }
}