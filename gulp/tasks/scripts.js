import { rollup } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { babel } from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";
import path from "path";
import config from "../config.js";
import { server } from "./serve.js";

const outputFileName = "main.bundle.js";

export const scripts = async () => {
  let bundle;
  try {
    const inputOptions = {
      input: config.paths.src.mainJs,
      plugins: [
        nodeResolve(),
        commonjs(),
        babel({
          babelHelpers: "bundled",
          exclude: "node_modules/**",
        }),
        config.production && terser(),
      ],
      onwarn: (warning, warn) => {
        if (warning.code === "THIS_IS_UNDEFINED") return;
        warn(warning);
      },
    };

    const outputOptions = {
      file: path.join(config.paths.dist.scripts, outputFileName),
      format: "iife",
      sourcemap: !config.production,
      name: "App",
    };

    bundle = await rollup(inputOptions);

    await bundle.write(outputOptions);

    server.stream();
  } catch (error) {
    console.error(" Rollup Build Error ".bgRed.white.bold + "\n", error);
    if (error.frame) {
      console.error(error.frame);
    }
    throw error;
  } finally {
    if (bundle) {
      await bundle.close();
    }
  }
};
