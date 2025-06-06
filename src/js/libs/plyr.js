export const plyrInit = (PlyrInstance) => {
  const aboutPlayerElement = document.querySelector("#about-player");
  const installationPlayerElement = document.querySelector('#installation-player')

  if (aboutPlayerElement) {
    const player = new PlyrInstance(aboutPlayerElement, {
      clickToPlay: true,
      muted: true,
      resetOnEnd: true,
      // controls: ['mute'],
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.intersectionRatio < 0.5 && !player.paused) {
              player.pause();
            }
            if (entry.intersectionRatio > 0.5 && player.paused) {
              player.play();
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

  if(installationPlayerElement) {
    const player = new PlyrInstance(installationPlayerElement, {
      clickToPlay: true,
      muted: true,
      resetOnEnd: true,
      // controls: ['mute'],
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.intersectionRatio < 0.5 && !player.paused) {
              player.pause();
            }
            if (entry.intersectionRatio > 0.5 && player.paused) {
              player.play();
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
