#!/usr/bin/env node
import process from "process";
import * as esbuild from "esbuild";

let enableMeta = false;

const plugins = [{
  name: 'esbuild-problem-matcher',
  setup(build) {
    let file = build.initialOptions.entryPoints[0];

    build.onStart(() => {
      console.log(`[watch] build started for ${file}`);
    });

    build.onEnd(result => {
      if(result.errors.length > 0) {
        result.errors.forEach((e) =>
          console.error(
            `> ${e.location.file}:${e.location.line}:${e.location.column}: error: ${e.text}`
          )
        );
      } else {
        console.log(`[watch] build finished for ${file}`);
        if (enableMeta) {
          fs.writeFileSync(`${file}.json`, JSON.stringify(result.metafile, null, 2));
        }
      }
    });
  },
}];

const watchContext = async (ctxp) => {
  let ctx = await ctxp;

  if (process.argv.includes("--watch")) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
};

let minify = process.argv.includes("--minify");
let disable_sourcemap = process.argv.includes("--sourcemap=no");
let sourcemap = disable_sourcemap ? null : { sourcemap: true };

// Node build
var cliEntry = "./frontend/pkg/mk-pkg.ts";
var nodecli = watchContext(esbuild.context({
  entryPoints: [cliEntry],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: "dist-pkg/mk-pkg.cjs",
  ...sourcemap,
  minify,
  plugins
}));

await nodecli;
