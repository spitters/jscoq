import React from "react";
import ReactDOM from "react-dom/client";

import { CoqManager } from "../../coq-manager";
import { CoqTabManager } from "../../coq-tab-manager";
import { CoqDocumentManager } from "../../coq-document-manager";
import { CoqGistDocumentManager } from "./coq-gist-document-manager";
import GistComponent, { File} from "./GistComponent";
import "./gist.css";

export class Gist {
  coq: CoqManager;
  docs: CoqGistDocumentManager;
  tabs: CoqTabManager;
  root: ReactDOM.Root;

  withCoqManager(coq: CoqManager) {
    let docs: CoqGistDocumentManager;
    if (!(coq.doc_manager instanceof CoqGistDocumentManager)) {
      docs = new CoqGistDocumentManager(coq, coq.doc_manager.documents);
      // ***TODO
      if (coq.doc_manager instanceof CoqDocumentManager && coq.doc_manager.setDocs)
        docs.setDocs = coq.doc_manager.setDocs;
      coq.doc_manager = docs;
    } else {
      docs = coq.doc_manager;
    }
    this.coq = coq;
    this.docs = docs;
    this.tabs = coq.tab_manager;
    return this;
  }

  static attach(coq: CoqManager, gistID: string) {
    const collab = new Gist().withCoqManager(coq);
    collab.init(gistID);
    return collab;
  }

  init(gistID: string) {
    const rootElement = document.getElementById("gist-root");
    this.root = ReactDOM.createRoot(rootElement);
    this.root.render(
      <React.StrictMode>
        <GistComponent gist={this} startGistID={gistID}/>
      </React.StrictMode>
    );
  }

  setFiles(files: File[]) {
    if (files.length === 0) {
      let extension = this.coq.options.content_type === 'plain' ? '.v' : '.mv';
      files.push({ filename: "gistfile1" + extension, content: ""});
    }
    this.docs.replaceAllDocuments(files);
    if (this.docs.documents.length > 0)
      this.tabs.setCurrent(this.tabs.createTab(this.docs.documents[0]));
  }

  getFiles(): { [key: string]: { content: string } } {
    return this.docs.getFiles();
  }

  removeDeletedFiles() {
    this.docs.removeDeletedFiles();
  }

  close() {
    this.root.unmount();
    let new_doc_manager = new CoqDocumentManager(this.coq, this.coq.doc_manager.documents);
    // ***TODO
    if (this.coq.doc_manager instanceof CoqDocumentManager && this.coq.doc_manager.setDocs)
      new_doc_manager.setDocs = this.coq.doc_manager.setDocs;
    this.coq.doc_manager = new_doc_manager;
  }
}
