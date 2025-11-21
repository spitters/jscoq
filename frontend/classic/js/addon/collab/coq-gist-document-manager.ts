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
    private deletedFiles: string[];
    /**
     * last up-to-date files on gist
     */ 
    private lastValidFiles: string[];

    constructor(manager: CoqManager, elems: string[] | CoqDocument[]) {
        super(manager, elems);
        this.files = {};
        this.deletedFiles = [];
        this.lastValidFiles = [];
    }

    deleteDocument(doc: CoqDocument) {
        super.deleteDocument(doc);
        if (this.lastValidFiles.includes(doc.filename)) {
            this.files[doc.filename] = null;
        } else {
            delete this.files[doc.filename];
        }
    };

    private deleteAllDocuments() {
        for (const doc of this.documents)
            doc.delete();
        this.documents.splice(0);
        if (this.setDocs) // ***TODO
            this.setDocs((docs) => []);
        this.manager.tab_manager.closeAll();
        this.files = {};
    }

    replaceAllDocuments(files: File[]) {
        this.deleteAllDocuments();
        this.lastValidFiles = files.map((f) => f.filename);
        for (const f of files) {
            if (!this.createDocument(f.content, f.filename)) {
                // todo error notif
                window.alert(`Failed to create file '${f.filename}'.`);
            }
        }
    }

    getFiles() {
        // get all files content
        for (const doc of this.documents) {
            this.files[doc.filename] = { content: doc.value };
        }
        // update deleted files
        for (const fn in this.files) {
            if (this.files[fn] === null && !this.deletedFiles.includes(fn))
                this.deletedFiles.push(fn);
        }
        return this.files;
    }

    private removeDeletedFiles() {
        const length = this.deletedFiles.length;
        for (let i = 0; i < length; i++) {
            let fn = this.deletedFiles.pop();
            if (this.files[fn] === null) {
                delete this.files[fn];
            }
        }
    }

    /**
     * process after request is fulfilled
     */
    requestFulfilled(result: any) {
        this.removeDeletedFiles();
        this.lastValidFiles = Object.keys(result.data.files);
    }
}