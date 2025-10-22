import { Octokit } from "@octokit/core";
import { useEffect, useState, Dispatch, SetStateAction, ChangeEvent } from "react";
import { Gist } from "./Gist"

/**
 * documentation :
 * https://docs.github.com/en/rest/gists/gists?apiVersion=2022-11-28
 */

const octokitRead = new Octokit();

export type File = {
  filename: string;
  content: string;
};

type NotifProps = {
  notif: string;
  setNotif: Dispatch<SetStateAction<string>>;
};

function Notif({ notif, setNotif }: NotifProps) {
  return (
    <div id="notif" hidden={notif === ""}>
      <button id="close-notif" onClick={() => setNotif("")}>
        &times;
      </button>
      &nbsp;{notif}
    </div>
  );
}

function makeErrorMessage(err: any) {
  return "Error " + err.status + " " + err.message;
}

type InputProps = {
  id: string;
  value: string;
  onChange: any;
  label?: string;
  placeholder?: string;
  type?: string;
};

function Input({ id, value, onChange, label, placeholder, type }: InputProps) {
  return (
    <>
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder ?? ""}
        type={type ?? "text"}
      />
    </>
  );
}

type RequestButtonProps = {
  gist: Gist;
  text: string;
  octokit: Octokit;
  requestRoute: string;
  requestOptions: any;
  onFulfilled: any;
  onRejected: any;
};

function RequestButton({
  gist,
  text,
  octokit,
  requestRoute,
  requestOptions,
  onFulfilled,
  onRejected,
}: RequestButtonProps) {
  const [isPending, setIsPending]: [boolean, any] = useState(false);
  return (
    <button
      disabled={isPending}
      onClick={() => {
        setIsPending(true);
        octokit
          .request(
            requestRoute,
            {
              ...requestOptions,
              files: gist.getFiles(),
            }
          )
          .then((res: any) => {
            setIsPending(false);
            onFulfilled(res);
          })
          .catch((err: any) => {
            setIsPending(false);
            onRejected(err);
          });
      }}
    >
      {text}
    </button>
  );
}

function buttonsElem(
  gist: Gist,
  gistID: string,
  setGistID: any,
  octokit: Octokit,
  gistURL: string,
  setNotif: Dispatch<SetStateAction<string>>,
) {
  let linkButton = (
    <a href={gistURL} target="_blank">
      <button>Go to Gist</button>
    </a>
  );

  let createButton = (
    <RequestButton
      gist={gist}
      text={"Save as new gist"}
      octokit={octokit}
      requestRoute={"POST /gists"}
      requestOptions={{
        headers: { "X-GitHub-Api-Version": "2022-11-28" },
      }}
      onFulfilled={(result: any) => {
        setNotif("Gist Created");
        setGistID(result.data.id);
        /* @ts-ignore */
        const url = new URL(location);
        url.searchParams.set("gist", gistID);
        history.pushState({}, "", url);
      }}
      onRejected={(err: any) => {
        console.log(err);
        setNotif(makeErrorMessage(err));
      }}
    />
  );

  let updateButton = (
    <RequestButton
      gist={gist}
      text={"Save gist"}
      octokit={octokit}
      requestRoute={"PATCH /gists/" + gistID}
      requestOptions={{
        gist_id: gistID,
        headers: { "X-GitHub-Api-Version": "2022-11-28" },
      }}
      onFulfilled={() => {
        setNotif("Gist Updated");
        gist.removeDeletedFiles();
      }}
      onRejected={(err: any) => {
        console.log(err);
        setNotif(makeErrorMessage(err));
      }}
    />
  );

  return {
    link: linkButton,
    create: createButton,
    update: updateButton,
  };
}

type GistComponentProps = {
  gist: Gist;
  startGistID?: string;
};

export default function GistComponent({ gist, startGistID }: GistComponentProps) {
  const [token, setToken]: [string, Dispatch<SetStateAction<string>>] = useState(
    ""
  );
  const octokitWrite = new Octokit({ auth: token });
  const gistHomeURL = "https://gist.github.com/";
  const [gistID, setGistID]: [string, Dispatch<SetStateAction<string>>] = useState(startGistID ?? "");
  const [gistURL, setGistURL]: [string, Dispatch<SetStateAction<string>>] = useState(gistHomeURL);
  const [notif, setNotif]: [string, Dispatch<SetStateAction<string>>] = useState("");

  useEffect(() => {
    if (gistID) {
      octokitRead
        .request("GET /gists/" + gistID, {
          gist_id: gistID,
          headers: { "X-GitHub-Api-Version": "2022-11-28" },
        })
        .then((result) => {
          let rawFiles = result.data.files;
          let files = Object.keys(rawFiles).map((f, i) => {
              return { idx: i, filename: f, content: rawFiles[f].content };
          });
          if (files.length === 0)
            setNotif("This gist does not contain any files.");
          gist.setFiles(files);
          setGistURL(result.data.html_url);
          // @ts-ignore
          const url = new URL(location);
          url.searchParams.set("gist", gistID);
          history.pushState({}, "", url);
        })
        .catch((err) => {
          console.log(err);
          setNotif(makeErrorMessage(err));
          setGistURL(gistHomeURL);
        });
    }
  }, [gistID]);

  let allButtons = buttonsElem(
    gist,
    gistID,
    setGistID,
    octokitWrite,
    gistURL,
    setNotif
  );

  return (
    <>
      <div className="GistComponent">
        <Notif notif={notif} setNotif={setNotif} />
        <div className="input-container">
          <div>
            <Input
              id={"input-id"}
              value={gistID}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setGistID(e.target.value.trim())}
              label={"Gist ID:"}
              placeholder={"gist id"}
            />
            {allButtons.link}
          </div>
          <div>
            <Input
              id={"input-token"}
              value={token}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setToken(e.target.value.trim())}
              label={"Gist Token:"}
              placeholder={"gist write token"}
              type={"password"}
            />
            {allButtons.create}
            {allButtons.update}
          </div>
        </div>
      </div>
    </>
  );
}
