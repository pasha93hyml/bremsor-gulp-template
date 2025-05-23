/**
 * Pagination controller class
 * @class
 */
export class Pagination {
  /**
   * Creates an instance of Pagination
   * @param {Object} config - Configuration options
   * @param {number} config.totalPages - Total number of pages
   * @param {number} config.currentPage - Current active page
   * @param {number} config.visiblePages - Maximum number of visible page buttons
   * @param {string} config.containerSelector - CSS selector for the pagination container
   * @param {string} config.contentSelector - CSS selector for the content to animate
   * @param {number} config.animationDuration - Duration of content animation in ms
   * @param {number} config.isMobile - is current device width less than 576px or not
   */
  constructor(config) {
    this.config = {
      totalPages: 1,
      currentPage: 1,
      visiblePages: 5,
      containerSelector: '.js-pagination-container',
      contentSelector: '.js-pagination-content-to-change',
      animationDuration: 1000,
      isMobile: false,
      ...config
    };

    this.totalPages = this.config.totalPages;
    this.currentPage = this.config.currentPage;
    this.visiblePages = this.config.visiblePages;
    this.container = document.querySelector(this.config.containerSelector);
    this.contentElement = document.querySelector(this.config.contentSelector);
    this.isMobile = this.config.isMobile

    if (!this.container) return;

    this.prevButton = this.container.querySelector('.js-pagination-prev');
    this.nextButton = this.container.querySelector('.js-pagination-next');
    this.pagesContainer = this.container.querySelector('.js-pagination-pages');
    this.middlePagesContainer = this.container.querySelector('.js-pagination-middle-pages');
    this.startEllipsis = this.container.querySelector('.js-pagination-start-ellipsis');
    this.endEllipsis = this.container.querySelector('.js-pagination-end-ellipsis');

    this.isAnimating = false;

    this._boundHandlers = {
      prevClick: this.#handlePrevClick.bind(this),
      nextClick: this.#handleNextClick.bind(this),
      pageClick: this.#handlePageClick.bind(this),
      animationEnd: this.#handleAnimationEnd.bind(this)
    };

    this.#init();
  }

  /**
   * Initialize the pagination
   * @private
   */
  #init() {
    this.#bindEvents();
    this.#render();
  }

  /**
   * Bind event listeners
   * @private
   */
  #bindEvents() {
    if (this.prevButton) {
      this.prevButton.addEventListener('click', this._boundHandlers.prevClick);
    }

    if (this.nextButton) {
      this.nextButton.addEventListener('click', this._boundHandlers.nextClick);
    }

    this.container.addEventListener('click', this._boundHandlers.pageClick);

    if (this.contentElement) {
      this.contentElement.addEventListener('animationend', this._boundHandlers.animationEnd);
    }
  }

  /**
   * Handle previous button click
   * @private
   */
  #handlePrevClick() {
    if (this.currentPage > 1 && !this.isAnimating) {
      this.goToPage(this.currentPage - 1);
    }
  }

  /**
   * Handle next button click
   * @private
   */
  #handleNextClick() {
    if (this.currentPage < this.totalPages && !this.isAnimating) {
      this.goToPage(this.currentPage + 1);
    }
  }

  /**
   * Handle page button click
   * @param {Event} event - Click event
   * @private
   */
  #handlePageClick(event) {
    const pageButton = event.target.closest('.js-pagination-page-button');
    if (pageButton && !this.isAnimating) {
      const page = parseInt(pageButton.dataset.page, 10);
      this.goToPage(page);
    }
  }

  /**
   * Handle animation end event
   * @private
   */
  #handleAnimationEnd() {
    this.isAnimating = false;
    this.contentElement.classList.remove('animate-fade-out-in');
  }

  /**
   * Navigate to a specific page
   * @param {number} page - Page number to navigate to
   * @returns {this}
   * @public
   */
  goToPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage || this.isAnimating) {
      return this;
    }

    this.isAnimating = true;
    this.currentPage = page;

    if (this.contentElement) {
      this.contentElement.classList.add('animate-fade-out-in');

      // Safety timeout in case animationend doesn't fire
      setTimeout(() => {
        if (this.isAnimating) {
          this.isAnimating = false;
          this.contentElement.classList.remove('animate-fade-out-in');
        }
      }, this.config.animationDuration + 100);
    } else {
      this.isAnimating = false;
    }

    this.#render();

    this.container.dispatchEvent(new CustomEvent('pageChange', {
      detail: { page: this.currentPage }
    }));

    return this;
  }

  /**
   * Calculate which pages should be visible
   * @returns {Object} Object with pages array and booleans for start and end ellipsis
   * @private
   */
  #calculateVisiblePages() {
    const halfVisible = Math.floor(this.visiblePages / 2);
    let start = Math.max(2, this.currentPage - halfVisible);
    let end = this.isMobile ?  Math.min(this.totalPages - 1, start + this.visiblePages - 2) : Math.min(this.totalPages - 1, start + this.visiblePages - 5);

    if (end >= this.totalPages - 1) {
      start = Math.max(2, this.totalPages - this.visiblePages + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return {
      pages,
      showStartEllipsis: start > 2,
      showEndEllipsis: end < this.totalPages - 1
    };
  }

  /**
   * Create a page button element
   * @param {number} page - Page number
   * @returns {HTMLElement} Button element
   * @private
   */
  #createPageButton(page) {
    const button = document.createElement('button');
    button.className = `w-4 min-w-4 md:w-6 h-6 md:min-w-6 flex items-center justify-center text-white text-sm md:text-lg cursor-pointer relative pagination-page-button js-pagination-page-button ${page === this.currentPage ? 'active' : ''}`;
    button.dataset.page = page;
    button.textContent = page;

    if (page === this.currentPage) {
      this.#animateActiveButton(button);
    }

    return button;
  }

  /**
   * Animate the active button underline
   * @param {HTMLElement} button - Button element to animate
   * @private
   */
  #animateActiveButton(button) {
    button.classList.add('active');
  }

  /**
   * Render the pagination
   * @private
   */
  #render() {
    if (!this.container) return;

    if (this.totalPages <= this.visiblePages) {
      const buttons = this.container.querySelectorAll('.js-pagination-page-button');
      buttons.forEach(button => {
        const page = parseInt(button.dataset.page, 10);
        button.classList.toggle('active', page === this.currentPage);
        if (page === this.currentPage) {
          this.#animateActiveButton(button);
        }
      });
      return;
    }

    const { pages, showStartEllipsis, showEndEllipsis } = this.#calculateVisiblePages();

    if (this.middlePagesContainer) {
      this.middlePagesContainer.innerHTML = '';

      pages.forEach(page => {
        this.middlePagesContainer.appendChild(this.#createPageButton(page));
      });
    }

    if (this.startEllipsis) {
      this.startEllipsis.style.display = showStartEllipsis ? 'inline' : 'none';
    }

    if (this.endEllipsis) {
      this.endEllipsis.style.display = showEndEllipsis ? 'inline' : 'none';
    }

    const firstPageButton = this.container.querySelector('.js-pagination-page-button[data-page="1"]');
    const lastPageButton = this.container.querySelector(`.js-pagination-page-button[data-page="${this.totalPages}"]`);

    if (firstPageButton) {
      firstPageButton.classList.toggle('active', this.currentPage === 1);
      if (this.currentPage === 1) {
        this.#animateActiveButton(firstPageButton);
      }
    }

    if (lastPageButton) {
      lastPageButton.classList.toggle('active', this.currentPage === this.totalPages);
      if (this.currentPage === this.totalPages) {
        this.#animateActiveButton(lastPageButton);
      }
    }

    if (this.prevButton) {
      this.prevButton.disabled = this.currentPage === 1;
    }

    if (this.nextButton) {
      this.nextButton.disabled = this.currentPage === this.totalPages;
    }
  }

  /**
   * Update pagination with new configuration
   * @param {Object} config - New configuration options
   * @returns {this}
   * @public
   */
  update(config) {
    Object.assign(this.config, config);

    if (config.totalPages !== undefined) {
      this.totalPages = config.totalPages;
    }

    if (config.currentPage !== undefined) {
      this.currentPage = config.currentPage;
    }

    if (config.visiblePages !== undefined) {
      this.visiblePages = config.visiblePages;
    }

    this.#render();
    return this;
  }

  /**
   * Destroy the pagination and clean up event listeners
   * @returns {void}
   * @public
   */
  destroy() {
    if (!this.container) return;

    if (this.prevButton) {
      this.prevButton.removeEventListener('click', this._boundHandlers.prevClick);
    }

    if (this.nextButton) {
      this.nextButton.removeEventListener('click', this._boundHandlers.nextClick);
    }

    this.container.removeEventListener('click', this._boundHandlers.pageClick);

    if (this.contentElement) {
      this.contentElement.removeEventListener('animationend', this._boundHandlers.animationEnd);
      this.contentElement.classList.remove('animate-fade-out-in');
    }

    // Clear references
    this.container = null;
    this.contentElement = null;
    this.prevButton = null;
    this.nextButton = null;
    this.pagesContainer = null;
    this.middlePagesContainer = null;
    this.startEllipsis = null;
    this.endEllipsis = null;
  }
}