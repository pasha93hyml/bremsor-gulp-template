export const plyrInit = (PlyrInstance) => {
  const playerElement = document.querySelector("#about-player");

  if (playerElement) {
    const player = new PlyrInstance(playerElement, {
      clickToPlay: true
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.intersectionRatio < 0.5 && !player.paused) {
              player.pause();
            }
          });
        },
        { threshold: 0.5 },
      );
      observer.observe(player.elements.container);
    } else {
      console.warn("Plyr target element #about-player not found.");
    }
  }
};
