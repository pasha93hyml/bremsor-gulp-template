class PageUtils {
  constructor() {}

  getCurrentPage(templatePath) {
    if (!templatePath) return "unknown";
    return templatePath.split("/").pop().replace(".html", "");
  }
}

const createPageUtils = () => new PageUtils();

export { createPageUtils };
