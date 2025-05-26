/**
 * Class presenting a simple search-list with search field component
 * @class
 */
export class SearchList {
  /**
   * Create a search-list component
   * @param {HTMLInputElement} input - search input element
   * @param {Object} config - configuration options
   * @param {string} config.inputSelector - CSS selector for the input search field
   * @param {string} config.listSelector - CSS selector for the list to search
   * @param {string} config.searchAttribute - data attribute to search in (optional)
   * @param {boolean} config.caseSensitive - whether search is case-sensitive
   */
  constructor(input, config = {}) {
    this.config = {
      inputSelector: '.js-searchlist-input',
      listSelector: '.js-searchlist-list',
      searchAttribute: null,
      caseSensitive: false,
      ...config
    };

    this.input = input;
    this.list = null;
    this.items = [];
    this.originalItems = [];

    this.init();
  }

  /**
   * Initialize the search list component
   */
  init() {
    // this.input = document.querySelector(this.config.inputSelector);
    this.list = document.querySelector(this.config.listSelector);

    if (!this.input || !this.list) {
      console.error('SearchList: Input or list element not found');
      return;
    }

    // Get target list from input's data-target attribute
    const targetList = this.input.dataset.target;
    if (targetList) {
      this.list = document.querySelector(`[data-name="${targetList}"]`);
    }

    this.items = Array.from(this.list.children);
    this.originalItems = [...this.items];

    this.bindEvents();
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    this.input.addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    this.input.addEventListener('keydown', (e) => {
      this.handleKeyNavigation(e);
    });
  }

  /**
   * Handle search functionality
   * @param {string} searchTerm - The search term
   */
  handleSearch(searchTerm) {
    const term = this.config.caseSensitive ? searchTerm : searchTerm.toLowerCase();

    this.items.forEach(item => {
      const searchText = this.getSearchText(item);
      const normalizedText = this.config.caseSensitive ? searchText : searchText.toLowerCase();

      if (normalizedText.includes(term)) {
        item.style.display = '';
        item.classList.remove('hidden');
      } else {
        item.style.display = 'none';
        item.classList.add('hidden');
      }
    });

    this.updateNoResultsMessage(term);
  }

  /**
   * Get text to search from item
   * @param {HTMLElement} item - List item element
   * @returns {string} Text to search
   */
  getSearchText(item) {
    if (this.config.searchAttribute) {
      return item.dataset[this.config.searchAttribute] || '';
    }
    return item.innerText.trim();
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyNavigation(e) {
    const visibleItems = this.getVisibleItems();
    const currentFocused = this.list.querySelector('.focused');
    let newIndex = -1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentFocused) {
          const currentIndex = visibleItems.indexOf(currentFocused);
          newIndex = Math.min(currentIndex + 1, visibleItems.length - 1);
        } else {
          newIndex = 0;
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (currentFocused) {
          const currentIndex = visibleItems.indexOf(currentFocused);
          newIndex = Math.max(currentIndex - 1, 0);
        } else {
          newIndex = visibleItems.length - 1;
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (currentFocused) {
          const button = currentFocused.querySelector('button');
          if (button) button.click();
        }
        break;

      case 'Escape':
        this.clearSearch();
        break;
    }

    if (newIndex >= 0 && visibleItems[newIndex]) {
      this.focusItem(visibleItems[newIndex]);
    }
  }

  /**
   * Get visible list items
   * @returns {HTMLElement[]} Array of visible items
   */
  getVisibleItems() {
    return this.items.filter(item =>
      item.style.display !== 'none' && !item.classList.contains('hidden')
    );
  }

  /**
   * Focus on specific item
   * @param {HTMLElement} item - Item to focus
   */
  focusItem(item) {
    this.items.forEach(i => i.classList.remove('focused'));

    item.classList.add('focused');
    item.scrollIntoView({ block: 'nearest' });
  }

  /**
   * Update or show no results message
   * @param {string} searchTerm - Current search term
   */
  updateNoResultsMessage(searchTerm) {
    const visibleItems = this.getVisibleItems();
    let noResultsMsg = this.list.querySelector('.no-results-message');

    if (visibleItems.length === 0 && searchTerm.trim()) {
      if (!noResultsMsg) {
        noResultsMsg = document.createElement('li');
        noResultsMsg.className = 'no-results-message text-xs text-gray-500 px-2 py-1';
        noResultsMsg.innerHTML = 'No results found';
        this.list.appendChild(noResultsMsg);
      }
      noResultsMsg.style.display = '';
    } else if (noResultsMsg) {
      noResultsMsg.style.display = 'none';
    }
  }

  /**
   * Clear search and show all items
   */
  clearSearch() {
    this.input.value = '';
    this.items.forEach(item => {
      item.style.display = '';
      item.classList.remove('hidden', 'focused');
    });
    this.updateNoResultsMessage('');
  }

  /**
   * Destroy the component and remove event listeners
   */
  destroy() {
    if (this.input) {
      this.input.removeEventListener('input', this.handleSearch);
      this.input.removeEventListener('keydown', this.handleKeyNavigation);
    }
  }

  /**
   * Reset the list to original state
   */
  reset() {
    this.clearSearch();
    this.items = [...this.originalItems];
  }
}