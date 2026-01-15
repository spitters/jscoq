#!/usr/bin/env node

/**
 * A utility script for regenerating the Rocq patches after you have edited
 * the source code of the checked-out version in the working directory.
 * Chunks are identified by badges of the form `(* filename.patch *)` appearing
 * in them.
 * One file per such badge is created, containing all the chunks bearing it.
 */

const fs = require('fs');
const { execSync } = require('child_process');


function main() {
    const text = execSync('git diff', {encoding: 'utf-8'}),
          gdiff = new GitDiff(text);

    for (let badge of new Set(text.match(/\(\* (\S*?[.]patch) \*\)/g))) {
        let fn = badge.match(/\S*?[.]patch/)[0];
        console.log(fn, badge);

        fs.writeFileSync(fn,
            gdiff.filterChunks(chunk => chunk.includes(badge))
                .unparse()
        );
    }
}


class GitDiff {

    constructor(contents) {
        if (Array.isArray(contents)) {
            this.blocks = contents;
            return;
        }

        this.blocks = this.parse(contents);
     }
     
     parse(text) {
        return [...splitBlocks(text, /^diff --git/mg)].map(block => {
            let chunks = [...splitBlocks(block, /^@@ /mg)];
            return {
                header: chunks[0],
                chunks: chunks.slice(1)
            };
        });
    }

    unparse() {
        return this.blocks.flatMap(b => b.chunks.length ? [b.header, ...b.chunks] : []).join('');
    }

    filterChunks(p) {
        return new GitDiff(this.blocks.map(b => ({
            ...b, chunks: b.chunks.filter(p)
        })));
    }
}


/* -- Some utility text processing functions -- */

function splitBlocks(text, boundaryRe) {
    return ranges([...text.matchAll(boundaryRe)].map(mo => mo.index), 0, text.length)
        .map(r => text.slice(r[0], r[1]));
}

function *ranges(boundaries, start=0, end=Infinity) {
    let pos = start;
    for (let at of boundaries) {
        if (at > pos) {
            yield [pos, at];
            pos = at;
        }
    }
    if (end > pos) yield [pos, end];
}



main();
