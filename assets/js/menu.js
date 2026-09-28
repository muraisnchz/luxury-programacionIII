/**
 * Hamburger Menu Functionality
 * Handles the responsive navigation menu for mobile and tablet devices
 */

class HamburgerMenu {
  constructor() {
    this.hamburgerBtn = document.getElementById('hamburger-btn');
    this.menuOverlay = document.getElementById('menu-overlay');
    this.sidebarMenu = document.getElementById('sidebar-menu');
    this.menuClose = document.getElementById('menu-close');
    this.isMenuOpen = false;

    this.init();
  }

  init() {
    if (!this.hamburgerBtn || !this.menuOverlay || !this.sidebarMenu || !this.menuClose) {
      console.warn('Menu elements not found. Menu functionality will not work.');
      return;
    }

    this.bindEvents();
    this.handleResize();
  }

  bindEvents() {
    // Open menu
    this.hamburgerBtn.addEventListener('click', () => this.openMenu());

    // Close menu via close button
    this.menuClose.addEventListener('click', () => this.closeMenu());

    // Close menu via overlay click
    this.menuOverlay.addEventListener('click', () => this.closeMenu());

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen) {
        this.closeMenu();
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());

    // Close menu when clicking on menu links
    const menuLinks = this.sidebarMenu.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        // Add a small delay to allow navigation to complete
        setTimeout(() => this.closeMenu(), 100);
      });
    });

    // Prevent menu close when clicking inside the menu
    this.sidebarMenu.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  openMenu() {
    this.isMenuOpen = true;
    this.hamburgerBtn.classList.add('active');
    this.menuOverlay.classList.add('active');
    this.sidebarMenu.classList.add('active');
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';

    // Focus management for accessibility
    this.menuClose.focus();
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.hamburgerBtn.classList.remove('active');
    this.menuOverlay.classList.remove('active');
    this.sidebarMenu.classList.remove('active');
    
    // Restore body scroll
    document.body.style.overflow = '';

    // Return focus to hamburger button
    this.hamburgerBtn.focus();
  }

  handleResize() {
    // Close menu if window is resized to desktop size
    if (window.innerWidth > 768 && this.isMenuOpen) {
      this.closeMenu();
    }
  }

  // Public method to toggle menu state
  toggle() {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  // Public method to check menu state
  getMenuState() {
    return this.isMenuOpen;
  }
}

// Initialize the hamburger menu when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.hamburgerMenu = new HamburgerMenu();
});

// Export for use in modules if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HamburgerMenu;
}