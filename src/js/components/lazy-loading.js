export const lazyLoading = (nodesList, instanceToInit) => {
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.2,
  };

  const observerCallback = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const container = entry.target;

        if (!container.dataset.viewerInitialized) {
          container.dataset.viewerInitialized = "true";
          instanceToInit(container);

          observer.unobserve(container);
        }
      }
    });
  };

  const intersectionObserver = new IntersectionObserver(
    observerCallback,
    observerOptions,
  );

  nodesList.forEach((node) => {
    intersectionObserver.observe(node);
  });
};
