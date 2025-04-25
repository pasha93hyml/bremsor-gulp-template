const navToggle = document.querySelector('.nav-toggle');
const mobileNav = document.querySelector('.mobile-nav');

if (navToggle && mobileNav) {
  navToggle.addEventListener('click', () => {
    mobileNav.classList.toggle('active');
    navToggle.classList.toggle('active');
  });
}

const currentPath = window.location.pathname;
const navLinks = document.querySelectorAll('nav a');

navLinks.forEach(link => {
  if (link.getAttribute('href') === currentPath) {
    link.classList.add('active');
  }
});