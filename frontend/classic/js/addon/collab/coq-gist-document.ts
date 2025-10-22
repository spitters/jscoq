import { CoqDocument } from "../../coq-document";

export class CoqGistDocument extends CoqDocument {

    constructor(content: string, filename: string) {
        super(content, filename);
    }

    // protected createUri() {
    //     this._uri = `gist:///src/${this.filename}`;
    // }
}
