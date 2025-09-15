import React from "react";
import ReactDOM from "react-dom/client";

import GistComponent, {File} from "./GistComponent";
import "./gist.css";
import { CoqManager } from "../../coq-manager";
import { CoqGistDocument } from "./coq-gist-document";

export class Gist {
  coq: CoqManager;

  withCoqManager(coq: CoqManager) {
    this.coq = coq;
    return this;
  }

  static attach(coq: any, gistID: string) {
    const collab = new Gist().withCoqManager(coq);
    collab.init(gistID);
    return collab;
  }

  init(gistID: string) {
    const rootElement = document.getElementById("gist-root");
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <GistComponent gist={this} startGistID={gistID}/>
      </React.StrictMode>
    );
  }

  setFile({idx, filename, content}: File) {
    const newDoc = new CoqGistDocument(content, filename);
    this.coq.createEditor(newDoc);
  }

  setFiles(files: File[]) {
    for (let i = this.coq.editors.length - 1; i >= 0; i--)
      this.coq.closeEditor(i);
    this.coq.current_editor = 0;
    for (let index = 0; index < files.length; index++) {
      this.setFile(files[index]);
    }
  }

  getFiles(): File[] {
    // ***TODO better access to docs / editors
    let files: File[] = [];
    for (let index = 0; index < this.coq.editors.length; index++) {
      const editor = this.coq.editors[index];
      files.push({idx: index, filename: editor.doc.getFilename(), content: editor.getValue()});
    }
    return files;
  }
}
