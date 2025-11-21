
import React, { useState, Dispatch, SetStateAction, MouseEvent, useContext, createContext } from "react";
import ReactDOM from "react-dom/client";

import { CoqManager } from "./coq-manager";
import { CoqDocumentManager } from "./coq-document-manager";
import { CoqDocument } from "./coq-document";

const URLContext = createContext<(relative: string) => URL>(null);

type DocumentButtonProps = {
  doc: CoqDocument;
  onClick: (doc: CoqDocument, ev: any) => void;
  onClose: (doc: CoqDocument) => void;
};

function DocumentButton({
  doc,
  onClick,
  onClose,
}: DocumentButtonProps) {
  const getURL = useContext(URLContext);
  // from https://feathericons.com
  let src = getURL("frontend/classic/images/trash-2.svg").toString();
  return (
    <button className="docButton" onClick={(ev) => onClick(doc, ev)}>
      {doc.filename}
      <img src={src} className="deleteButton" onClick={() => onClose(doc)}/>
    </button>
  );
}

type DocumentListProps = {
  docs: CoqDocument[];
  onClick: (doc: CoqDocument, ev: any) => void;
  onClose: (doc: CoqDocument) => void;
};

function DocumentList({
  docs,
  onClick,
  onClose,
}: DocumentListProps) {
  return (
    <>
      {docs.map((doc, idx) => (
        <DocumentButton
          key={idx}
          doc={doc}
          onClick={onClick}
          onClose={onClose}
        />
      ))}
    </>
  );
}

type DocumentManagerComponentProps = {
  manager: CoqManager;
  onDocButtonClick: (doc: CoqDocument, ev: any) => void;
  onDocButtonClose: (doc: CoqDocument) => void;
  onAddDocClick: (fn: string) => boolean;
};

function DocumentManagerComponent({ 
  manager,
  onDocButtonClick,
  onDocButtonClose,
  onAddDocClick,
}: DocumentManagerComponentProps) {
  const [docs, setDocs]: [CoqDocument[], Dispatch<SetStateAction<CoqDocument[]>>] = 
      useState([...manager.doc_manager.documents]);
  const [fn, setFn]: [string , Dispatch<SetStateAction<string>>] = useState("");
  const [haveCollab, setHaveCollab]: [boolean, Dispatch<SetStateAction<boolean>>] = 
      useState(manager.isCollabOpened());
  const [show, setShow]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false);
  const getURL = useContext(URLContext);
  // from https://feathericons.com
  let srcHide = getURL("frontend/classic/images/chevrons-left.svg").toString();
  let srcShow = getURL("frontend/classic/images/chevrons-right.svg").toString();
  // ***TODO
  (manager.doc_manager as CoqDocumentManager).setDocs = setDocs;

  const handleFileInputKey = (e) => {
    if (e.key === 'Enter') {
      if(onAddDocClick(fn))
        setFn("");
    }
  };

  let addButton = (
    <button onClick={() => {
      if (onAddDocClick(fn))
        setFn("");
      // setDocs([...doc_manager.documents]);
    }}>
      Add document
    </button>
  );
  let inputFn = (
    <input
      name="filename"
      placeholder="filename"
      value={fn}
      onKeyDown={handleFileInputKey}
      onChange={(v) => setFn(v.target.value)}
    />
  );
  let openCollabButton = (
    <button onClick={() => {
      if (!haveCollab) {
        manager.openCollab();
        setHaveCollab(true);
      } else {
        manager.closeCollab();
        setHaveCollab(false);
      }
    }}>
      { ((!haveCollab) ? "Open" : "Close") + " Gist" /* or "Collab" ? */}
    </button>
  );
  let showButton = (
    <button 
      onClick={() => setShow(() => !show)}
      style={{ minWidth: "30px", padding: "0px" }}
    >
      <img src={ (show) ? srcHide : srcShow }/>
    </button>
  );
  let content = (
    <>
      {addButton}
      {inputFn}
      <DocumentList
        docs={docs}
        onClick={onDocButtonClick}
        onClose={onDocButtonClose}
      />
      {openCollabButton}
    </>
  );
  return (
    <>
      {showButton}
      {show && content}
    </>
  )
}

function getFileExtension(filename: string) {
  if (!filename.includes('.') || filename.endsWith('.')) return '';
  return filename.slice(filename.lastIndexOf('.') + 1);
}

function isValidFilename(filename: string) {
    const firstChar = filename.charAt(0);
    /**
     * accept only alphabetic letters, excluding non-alphabetic characters like Chinese or Japanese
     */
    const validFirstChar = firstChar.toUpperCase() !== firstChar.toLowerCase();
    const noInvalidChar = [' ', '-'].every((c) => !filename.includes(c));
    let ext = getFileExtension(filename);
    const validExtension = (ext === 'mv') || (ext === 'v');
    return validFirstChar && noInvalidChar && validExtension;
}

export function initDocumentManagerComponent(manager: CoqManager) {
  // open doc
  let onDocButtonClick = (doc: CoqDocument, ev: MouseEvent) => {
    if (!(ev.target instanceof HTMLButtonElement)) return;
    let tab_manager = manager.tab_manager;
    let tab = tab_manager.findTab(doc);
    if (!tab)
      tab = tab_manager.createTab(doc);
    tab_manager.setCurrent(tab);
  };

  // delete doc
  let onDocButtonClose = (doc: CoqDocument) => {
    if (window.confirm(`Are you sure you want to delete '${doc.filename}' ?`)) {
      manager.doc_manager.deleteDocument(doc);
    }
  };

  let onAddDocClick = (fn: string) => {
    if (!isValidFilename(fn)) {
      // ***TODO use notif like gist component
      window.alert(`The filename must start with an alphabetic letter, not contain spaces or '-', and must end with .mv or .v.`);
      return false;
    }
    const createSuccess = manager.doc_manager.createDocument("", fn);
    if (!createSuccess) {
      // ***TODO use notif like gist component
      window.alert(`This filename '${fn}' already exists.`);
      return false;
    }
    // open new tab
    let doc = manager.doc_manager.documents.find((doc) => doc.filename === fn);
    let tab_manager = manager.tab_manager;
    let tab = tab_manager.createTab(doc);
    tab_manager.setCurrent(tab);
    return true;
  };

  // to get icon
  const getURL = (relative: string) =>
    new URL(relative, manager.options.base_path);

  const rootElement = document.getElementById(manager.doc_manager.container_id);
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <URLContext.Provider value={getURL}>
        <DocumentManagerComponent
        manager={manager}
        onDocButtonClick={onDocButtonClick}
        onDocButtonClose={onDocButtonClose}
        onAddDocClick={onAddDocClick}
        />
      </URLContext.Provider>
    </React.StrictMode>
  );
}
