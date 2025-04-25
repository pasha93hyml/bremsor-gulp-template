import postcssImport from "postcss-import";
import postcssNesting from "postcss-nesting";
import tailwindcssPostcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";

export default {
  plugins: [
    postcssImport,
    postcssNesting,
    tailwindcssPostcss,
    autoprefixer
  ]
};