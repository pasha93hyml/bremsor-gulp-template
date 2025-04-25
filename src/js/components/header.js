function ShopList() {
  const shopListEl = document.querySelector("[data-shop-list]");
  const shopList = document.querySelector("[data-list-to-sort]");
  const shopToggle = document.querySelector("[data-shop-toggle]");
  const closeButton = document.querySelector("[data-shop-close]");
  const sortButton = document.querySelector("[data-shop-sort]");
  let sortOrder = "asc";

  function handleToggle() {
    if (!shopListEl) return;
    shopListEl.classList.remove("hidden");
    document.body.classList.add("lock-scroll");
  }

  function handleClose() {
    if (!shopListEl) return;
    shopListEl.classList.add("hidden");
    document.body.classList.remove("lock-scroll");
  }

  function handleSort() {
    if (!sortButton) return;

    sortOrder = sortOrder === "asc" ? "desc" : "asc";

    const sortText = sortButton.querySelector("[data-sort-text]");
    if (sortText) {
      sortText.textContent = sortOrder === "asc" ? "A-Z" : "Z-A";
    }

    const elementsToSort = [
      ...shopList.querySelectorAll("[data-item-to-sort]"),
    ];
    const sortedList = elementsToSort.reverse()

    shopList.innerHTML = '';
    shopList.append(...sortedList)

  }

  function init() {
    if (shopToggle) {
      shopToggle.addEventListener("click", handleToggle);
    }

    if (closeButton) {
      closeButton.addEventListener("click", handleClose);
    }

    if (sortButton) {
      sortButton.addEventListener("click", handleSort);
    }
  }

  function destroy() {
    if (shopToggle) {
      shopToggle.removeEventListener("click", handleToggle);
    }

    if (closeButton) {
      closeButton.removeEventListener("click", handleClose);
    }

    if (sortButton) {
      sortButton.removeEventListener("click", handleSort);
    }
  }

  return { init, destroy };
}

function MobileMenu() {
  const mobileMenu = document.querySelector("[data-mobile-menu]");
  const toggleButton = document.querySelector("[data-mobile-toggle]");
  const closeButton = document.querySelector("[data-mobile-close]");
  const shopButton = document.querySelector("[data-mobile-shop]");
  const shopListEl = document.querySelector("[data-shop-list]");

  function handleToggle() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove("-translate-x-full");
    mobileMenu.classList.add("translate-x-0");
    document.body.classList.add("lock-scroll");
  }

  function handleClose() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove("translate-x-0");
    mobileMenu.classList.add("-translate-x-full");
    document.body.classList.remove("lock-scroll");
  }

  function handleShop() {
    handleClose();
    setTimeout(() => {
      shopListEl.classList.remove("hidden");
      document.body.classList.add("lock-scroll");
    }, 300);
  }

  function init() {
    if (toggleButton) {
      toggleButton.addEventListener("click", handleToggle);
    }

    if (closeButton) {
      closeButton.addEventListener("click", handleClose);
    }

    if (shopButton) {
      shopButton.addEventListener("click", handleShop);
    }
  }

  function destroy() {
    if (toggleButton) {
      toggleButton.removeEventListener("click", handleToggle);
    }

    if (closeButton) {
      closeButton.removeEventListener("click", handleClose);
    }

    if (shopButton) {
      shopButton.removeEventListener("click", handleShop);
    }
  }

  return { init, destroy };
}

function HeaderScroll() {
  const header = document.querySelector("[data-header]");
  let lastScrollTop = 0;

  function handleScroll() {
    if (!header) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > 10) {
      header.classList.add("bg-black-second", "lg:top-0", "top-0");
      header.classList.remove("bg-black-second/65", "lg:top-12.5", "top-11.5");
    } else {
      header.classList.remove("bg-black-second", "lg:top-0", "top-0");
      header.classList.add("bg-black-second/65", "lg:top-12.5", "top-11.5");
    }

    lastScrollTop = scrollTop;
  }

  function init() {
    window.addEventListener("scroll", handleScroll);
    handleScroll();
  }

  function destroy() {
    window.removeEventListener("scroll", handleScroll);
  }

  return { init, destroy };
}

function ResponsiveHandler() {
  const mobileElements = document.querySelectorAll("[data-mobile-only]");
  const desktopElements = document.querySelectorAll("[data-desktop-only]");
  let isMobile = false;

  function checkScreenSize() {
    const currentIsMobile = window.innerWidth < 1024;

    if (currentIsMobile !== isMobile) {
      isMobile = currentIsMobile;
      updateElementsVisibility();
    }
  }

  function updateElementsVisibility() {
    mobileElements.forEach((el) => {
      if (isMobile) {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    });

    desktopElements.forEach((el) => {
      if (!isMobile) {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    });
  }

  function init() {
    window.addEventListener("resize", checkScreenSize);
    checkScreenSize();
  }

  function destroy() {
    window.removeEventListener("resize", checkScreenSize);
  }

  return { init, destroy };
}

function createHeader() {
  const shopList = ShopList();
  const mobileMenu = MobileMenu();
  const headerScroll = HeaderScroll();
  const responsiveHandler = ResponsiveHandler();

  function init() {
    shopList.init();
    mobileMenu.init();
    headerScroll.init();
    responsiveHandler.init();
  }

  function destroy() {
    shopList.destroy();
    mobileMenu.destroy();
    headerScroll.destroy();
    responsiveHandler.destroy();
  }

  return { init, destroy };
}

export function initHeader() {
  const header = createHeader();
  header.init();
  return header;
}
