function CashbackBanner() {
  const banner = document.querySelector("[data-cashback-banner]");
  const toggle = document.querySelector("[data-cashback-toggle]");
  const arrow = toggle ? toggle.querySelector("svg") : null;

  function handleToggle() {
    banner.classList.toggle("lg:translate-x-0");
    banner.classList.toggle("lg:translate-x-[calc(100%_+_30px)]");
    arrow.classList.toggle("rotate-180");
    arrow.classList.toggle("rotate-0");
  }

  function init() {
    if (!banner || !toggle) return;
    toggle.addEventListener("click", handleToggle);
    window.addEventListener("click", (event) => {
      if(!event.target.closest("[data-cashback-banner]")) {
        banner.classList.remove("lg:translate-x-0");
        banner.classList.add("lg:translate-x-[calc(100%_+_30px)]");
        arrow.classList.remove("rotate-180");
        arrow.classList.add("rotate-0");
      }
    })
  }

  function destroy() {
    if (toggle) {
      toggle.removeEventListener("click", handleToggle);
    }
  }

  return { init, destroy };
}

function MobileBanner() {
  const banner = document.querySelector("[data-mobile-banner]");
  const toggle = document.querySelector("[data-mobile-toggle-banner]");
  const close = document.querySelector("[data-mobile-close-banner]");
  const arrow = toggle ? toggle.querySelector("svg") : null;

  const closeBanner = () => {
    banner.classList.add("-z-10", "opacity-0");
    banner.classList.remove(
      "z-100",
      "opacity-100",
      "appearance-auto",
      "touch-auto",
    );
  };

  const handleBannerBackdrop = (event) => {
    console.log("event mounted/unmounted");
    if (
      !event.target.closest("[data-mobile-banner]") &&
      !event.target.closest("[data-mobile-toggle-banner]")
    ) {
      closeBanner();
      arrow.classList.toggle("rotate-180");
      arrow.classList.toggle("rotate-0");
    }
  };

  function toggleBanner(show) {
    if (show) {
      banner.classList.remove("-z-10", "opacity-0");
      banner.classList.add(
        "z-110",
        "opacity-100",
        "appearance-auto",
        "touch-auto",
      );
      window.addEventListener("click", handleBannerBackdrop);
    } else {
      closeBanner();
      window.removeEventListener("click", handleBannerBackdrop);
    }

    arrow.classList.toggle("rotate-180");
    arrow.classList.toggle("rotate-0");
  }

  function init() {
    if (!banner || !toggle || !close) return;
    toggle.addEventListener("click", () => toggleBanner(true));
    close.addEventListener("click", () => toggleBanner(false));
  }

  function destroy() {
    if (toggle) toggle.removeEventListener("click", () => toggleBanner(true));
    if (close) close.removeEventListener("click", () => toggleBanner(false));
  }

  return { init, destroy };
}

function createHero() {
  const cashbackBanner = CashbackBanner();
  const mobileBanner = MobileBanner();

  function init() {
    cashbackBanner.init();
    mobileBanner.init();
  }

  function destroy() {
    cashbackBanner.destroy();
    mobileBanner.destroy();
  }

  return { init, destroy };
}

export function initHero() {
  const hero = createHero();
  hero.init();
  return hero;
}
