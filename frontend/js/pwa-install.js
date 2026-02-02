// PWA Installation Helper - Enhanced for Mobile Support
class PWAInstall {
  constructor() {
    this.deferredPrompt = null;
    this.installButton = null;
    this.isIOS = this.detectIOS();
    this.isMobile = this.detectMobile();
    this.init();
  }

  detectIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768 && window.innerHeight <= 1024);
  }

  init() {
    // Listen for the beforeinstallprompt event (Android/Chrome)
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA install prompt available (Android/Chrome)');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      this.deferredPrompt = e;
      // Show the install button
      this.showInstallButton();
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', (evt) => {
      console.log('PWA was installed successfully');
      this.hideInstallButton();
      this.showSuccessMessage();
    });

    // Check if already installed
    if (this.isInStandaloneMode()) {
      console.log('PWA is already installed');
      return;
    }

    // For iOS, show install instructions since it doesn't support beforeinstallprompt
    if (this.isIOS && !this.isInStandaloneMode()) {
      setTimeout(() => {
        this.showIOSInstallInstructions();
      }, 3000); // Show after 3 seconds
    }

    // Check for service worker support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        console.log('Service Worker ready');
      });
    }
  }

  isInStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  showInstallButton() {
    // Create install button if it doesn't exist
    if (!this.installButton) {
      this.installButton = document.createElement('button');
      this.installButton.id = 'pwa-install-btn';
      this.installButton.innerHTML = '<i class="fas fa-download"></i> Install App';
      this.installButton.className = 'btn btn-primary pwa-install-btn';
      this.installButton.style.cssText = `
        position: fixed;
        bottom: ${this.isMobile ? '15px' : '20px'};
        right: ${this.isMobile ? '15px' : '20px'};
        z-index: 10000;
        background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
        color: white;
        border: none;
        padding: ${this.isMobile ? '10px 16px' : '12px 20px'};
        border-radius: 50px;
        font-weight: 600;
        font-size: ${this.isMobile ? '13px' : '14px'};
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideInRight 0.4s ease-out;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      `;

      // Add click handler
      this.installButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.installPWA();
      });

      document.body.appendChild(this.installButton);
    }

    this.installButton.style.display = 'flex';
  }

  hideInstallButton() {
    if (this.installButton) {
      this.installButton.style.display = 'none';
    }
  }

  async installPWA() {
    if (!this.deferredPrompt) {
      console.log('Install prompt not available, showing manual instructions');
      this.showManualInstallInstructions();
      return;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;

    // Reset the deferred prompt
    this.deferredPrompt = null;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      this.hideInstallButton();
      this.showSuccessMessage();
    } else {
      console.log('User dismissed the install prompt');
    }
  }

  showIOSInstallInstructions() {
    if (this.installButton) return; // Don't show if regular button exists

    const instructions = document.createElement('div');
    instructions.id = 'ios-install-instructions';
    instructions.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
        color: white;
        padding: 15px;
        border-radius: 12px;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        animation: slideInUp 0.4s ease-out;
        text-align: center;
      ">
        <i class="fas fa-share" style="margin-right: 8px;"></i>
        Tap the share button <i class="fas fa-plus" style="margin: 0 8px;"></i> then "Add to Home Screen"
        <button onclick="this.parentElement.remove()" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 5px 10px;
          border-radius: 20px;
          margin-top: 10px;
          cursor: pointer;
          font-size: 12px;
        ">Dismiss</button>
      </div>
    `;

    // Add slideInUp animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInUp {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(instructions);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (instructions.parentElement) {
        instructions.remove();
      }
    }, 10000);
  }

  showManualInstallInstructions() {
    const instructions = document.createElement('div');
    instructions.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10001;
        max-width: 300px;
        text-align: center;
        font-family: Arial, sans-serif;
      ">
        <h3 style="margin: 0 0 15px 0; color: #2c3e50;">Install App</h3>
        <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">
          ${this.isIOS ?
            'Tap the share button <i class="fas fa-share"></i> then "Add to Home Screen"' :
            'Look for "Add to Home screen" or "Install" in your browser menu'}
        </p>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #2c3e50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 25px;
          cursor: pointer;
        ">Got it</button>
      </div>
    `;

    document.body.appendChild(instructions);
  }

  showSuccessMessage() {
    const message = document.createElement('div');
    message.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #27ae60;
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        z-index: 10001;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: slideInDown 0.3s ease-out;
      ">
        <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
        App installed successfully!
      </div>
    `;

    // Add slideInDown animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInDown {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes slideOutUp {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(-50px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(message);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (message.parentElement) {
        message.style.animation = 'slideOutUp 0.3s ease-in';
        setTimeout(() => message.remove(), 300);
      }
    }, 3000);
  }
}

// Initialize PWA install when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PWAInstall();
});