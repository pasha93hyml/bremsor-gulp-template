function animateOnScroll() {
  const elements = document.querySelectorAll('.animate-on-scroll');

  elements.forEach(element => {
    const elementPosition = element.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;

    if (elementPosition < windowHeight - 100) {
      element.classList.add('animated');
    }
  });
}

window.addEventListener('scroll', animateOnScroll);

document.addEventListener('DOMContentLoaded', animateOnScroll);