/* Shared interactions for every page. Add small site-wide behavior here. */
document.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.primary-nav');

  // Mobile navigation: keep the button state available to screen readers.
  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => {
      const isOpen = navigation.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });
    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navigation.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // About page photo carousel: show three photos and loop continuously.
  document.querySelectorAll('[data-photo-carousel]').forEach((carousel) => {
    const viewport = carousel.querySelector('[data-photo-track]');
    const rail = carousel.querySelector('[data-photo-rail]');
    const previousButton = carousel.querySelector('[data-photo-prev]');
    const nextButton = carousel.querySelector('[data-photo-next]');

    if (!viewport || !rail || !previousButton || !nextButton) return;

    const originalSlides = [...rail.querySelectorAll('.about-photo-slide')];
    if (originalSlides.length < 2) return;

    // Clone one slide at each end so a single-photo view can wrap seamlessly.
    const cloneCount = 1;
    const makeClone = (slide) => {
      const clone = slide.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('img').forEach((image) => { image.alt = ''; });
      return clone;
    };
    rail.prepend(...originalSlides.slice(-cloneCount).map(makeClone));
    rail.append(...originalSlides.slice(0, cloneCount).map(makeClone));

    let index = cloneCount;
    let queuedMoves = 0;
    let isMoving = false;

    const stride = () => {
      const firstSlide = rail.querySelector('.about-photo-slide');
      if (!firstSlide) return 0;
      const gap = parseFloat(window.getComputedStyle(rail).columnGap) || 0;
      return firstSlide.getBoundingClientRect().width + gap;
    };

    const positionRail = (animate = true) => {
      rail.style.transition = animate ? '' : 'none';
      rail.style.transform = `translate3d(${-index * stride()}px, 0, 0)`;
      if (!animate) {
        // Re-enable the CSS transition after the instant reposition at a loop boundary.
        requestAnimationFrame(() => { rail.style.transition = ''; });
      }
    };

    const move = (direction) => {
      if (isMoving) {
        queuedMoves += direction;
        return;
      }
      index += direction;
      isMoving = true;
      positionRail();
    };

    rail.addEventListener('transitionend', (event) => {
      if (event.target !== rail || event.propertyName !== 'transform') return;

      if (index >= cloneCount + originalSlides.length) {
        index -= originalSlides.length;
        positionRail(false);
      } else if (index < cloneCount) {
        index += originalSlides.length;
        positionRail(false);
      }

      isMoving = false;
      if (queuedMoves) {
        const nextDirection = Math.sign(queuedMoves);
        queuedMoves -= nextDirection;
        // Wait one frame so a loop-boundary jump has restored the CSS transition.
        requestAnimationFrame(() => move(nextDirection));
      }
    });

    previousButton.addEventListener('click', () => move(-1));
    nextButton.addEventListener('click', () => move(1));
    viewport.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
    });

    let touchStartX = null;
    viewport.addEventListener('pointerdown', (event) => {
      touchStartX = event.clientX;
    });
    viewport.addEventListener('pointerup', (event) => {
      if (touchStartX === null) return;
      const distance = event.clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(distance) > 40) move(distance < 0 ? 1 : -1);
    });
    viewport.addEventListener('pointercancel', () => { touchStartX = null; });

    // Start with the first real photo; update the offset if the viewport resizes.
    positionRail(false);
    window.addEventListener('resize', () => positionRail(false));
  });

  // Keep the footer year current automatically.
  document.querySelectorAll('[data-year]').forEach((year) => {
    year.textContent = new Date().getFullYear();
  });
});
