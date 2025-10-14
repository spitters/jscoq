import { CoqDocument, content } from "../../coq-document";

export class CoqGistDocument extends CoqDocument {

    constructor(content: string, filename: string, content_type: content) {
        super(content, filename, content_type);
    }

    protected createUri() {
        this.uri = `gist:///src/${this.filename}`;
    }

    // save()
}
