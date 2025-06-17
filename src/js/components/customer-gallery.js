export class CustomerGallery {
  constructor(KeenSliderInstance, imagesData) {
    this.KeenSliderInstance = KeenSliderInstance;
    this.imagesData = imagesData;
    this.modal = null;
    this.slider = null;
    this.sliderInstance = null;
    this.currentImageIndex = 0;
    this.allImages = [];
    this.isSliderInitialized = false;

    this.init();
  }

  init() {
    this.setupElements();
    this.flattenImages();
    this.createSlides(); // Створюємо слайди одразу
    this.bindEvents();
  }

  setupElements() {
    this.modal = document.getElementById('gallery-modal');
    this.slider = document.getElementById('gallery-slider');
    this.closeBtn = document.getElementById('gallery-close');
    this.prevBtn = document.getElementById('gallery-slider-prev');
    this.nextBtn = document.getElementById('gallery-slider-next');
    this.triggers = document.querySelectorAll('.js-gallery-trigger');
  }

  flattenImages() {
    this.allImages = [];
    this.imagesData.images.forEach((group, groupIndex) => {
      group.imageData.forEach((image, imageIndex) => {
        this.allImages.push({
          ...image,
          groupIndex,
          imageIndex
        });
      });
    });
  }

  createSlides() {
    if (!this.slider) return;

    this.slider.innerHTML = '';

    this.allImages.forEach((image, index) => {
      const slide = document.createElement('div');
      slide.className = 'keen-slider__slide flex items-center justify-center rounded-[10px] overflow-hidden';

      slide.innerHTML = `
        <img
          src="${image.image_src}"
          alt="Gallery image ${index + 1}"
          class="w-full aspect-1/1 object-cover"
        />
      `;

      this.slider.appendChild(slide);
    });
  }

  initSlider() {
    if (this.isSliderInitialized || !this.slider) return;

    this.sliderInstance = new this.KeenSliderInstance(this.slider, {
      loop: true,
      initial: 0,
      slides: {
        perView: 1,
        spacing: 0,
      },
    });

    this.isSliderInitialized = true;
  }

  bindEvents() {
    this.triggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => this.handleTriggerClick(e));
    });

    this.closeBtn?.addEventListener('click', () => this.closeModal());
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    document.addEventListener('keydown', (e) => this.handleKeydown(e));

    this.prevBtn?.addEventListener('click', () => this.sliderInstance?.prev());
    this.nextBtn?.addEventListener('click', () => this.sliderInstance?.next());
  }

  handleTriggerClick(e) {
    const trigger = e.currentTarget;
    const gridIndex = parseInt(trigger.dataset.gridIndex);
    const imageIndex = parseInt(trigger.dataset.imageIndex);

    const globalIndex = this.findGlobalImageIndex(gridIndex, imageIndex);

    this.openModal(globalIndex);
  }

  findGlobalImageIndex(gridIndex, imageIndex) {
    let globalIndex = 0;

    for (let i = 0; i < gridIndex; i++) {
      globalIndex += this.imagesData.images[i].imageData.length;
    }

    return globalIndex + imageIndex;
  }

  openModal(startIndex = 0) {
    this.currentImageIndex = startIndex;
    this.showModal();

    // Ініціалізуємо слайдер після показу модального вікна
    if (!this.isSliderInitialized) {
      // Невелика затримка щоб модальне вікно встигло відобразитися
      setTimeout(() => {
        this.initSlider();
        if (this.sliderInstance && startIndex > 0) {
          this.sliderInstance.moveToIdx(startIndex);
        }
      }, 50);
    } else {
      // Якщо слайдер вже ініціалізований, просто переходимо до потрібного слайду
      if (this.sliderInstance && startIndex > 0) {
        this.sliderInstance.moveToIdx(startIndex);
      }
    }
  }

  showModal() {
    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.modal.classList.add('hidden');
    this.modal.classList.remove('flex');
    document.body.style.overflow = '';
  }

  handleKeydown(e) {
    if (!this.modal.classList.contains('hidden')) {
      switch (e.key) {
        case 'Escape':
          this.closeModal();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.sliderInstance?.prev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.sliderInstance?.next();
          break;
      }
    }
  }

  destroy() {
    if (this.sliderInstance) {
      this.sliderInstance.destroy();
      this.isSliderInitialized = false;
    }

    this.triggers.forEach(trigger => {
      trigger.removeEventListener('click', this.handleTriggerClick);
    });

    document.removeEventListener('keydown', this.handleKeydown);
  }
}