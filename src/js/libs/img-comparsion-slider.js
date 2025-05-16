export const comparisonSliderInitAnimation = () => {
  const comparisonContainer = document.querySelector("img-comparison-slider");
  if (!comparisonContainer) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);

          const steps = [];
          for (let i = 50; i > 40; i--) {
            steps.push(i);
          }
          for (let i = 40; i <= 60; i++) {
            steps.push(i);
          }
          for (let i = 60; i >= 50; i--) {
            steps.push(i);
          }

          const animate = (step) => {
            comparisonContainer.value = step;
          };

          steps.forEach((step, idx) => {
            setTimeout(animate.bind(null, step), 200 + idx * 40);
          });
        }
      });
    },
    { threshold: 0.5 },
  );

  observer.observe(comparisonContainer);
};
