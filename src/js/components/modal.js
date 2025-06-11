export class Modal {
  constructor(modalElement) {
    this.modal = modalElement;
    this.modalId = this.modal.dataset.modal;
    this.overlay = this.modal.querySelector('.modal__overlay');
    this.container = this.modal.querySelector('.modal__container');
    this.closeButtons = this.modal.querySelectorAll('[data-modal-close]');
    this.isOpen = this.modal.classList.contains('is-open');

    this.init();
  }

  init() {
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);

    this.closeButtons.forEach(button => {
      button.addEventListener('click', this.close);
    });

    this.overlay.addEventListener('click', this.handleClickOutside);
    document.addEventListener('keydown', this.handleKeyDown);

    Modal.registry.set(this.modalId, this);
  }

  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    
    this.modal.dispatchEvent(new CustomEvent('modal:open', {
      bubbles: true,
      detail: { modalId: this.modalId }
    }));
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.modal.classList.remove('is-open');
    document.body.style.overflow = '';

    this.modal.dispatchEvent(new CustomEvent('modal:close', {
      bubbles: true,
      detail: { modalId: this.modalId }
    }));
  }

  handleKeyDown(event) {
    if (event.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  handleClickOutside(event) {
    if (event.target === this.overlay) {
      this.close();
    }
  }

  destroy() {
    this.closeButtons.forEach(button => {
      button.removeEventListener('click', this.close);
    });

    this.overlay.removeEventListener('click', this.handleClickOutside);
    document.removeEventListener('keydown', this.handleKeyDown);

    Modal.registry.delete(this.modalId);
  }

  static registry = new Map();

  static getModal(modalId) {
    return this.registry.get(modalId);
  }
}

export function initModals() {
  const modalElements = document.querySelectorAll('[data-modal]');
  modalElements.forEach(modalElement => {
    const modal = new Modal(modalElement);
    if(modalElement.dataset.forceOpen) {
      setTimeout(() => modal.open(), 5000);
    }
  });

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-modal-trigger]');
    if (trigger) {
      const modalId = trigger.dataset.modalTrigger;
      const modal = Modal.getModal(modalId);
      if (modal) {
        modal.open();
      }
    }
  });
}
