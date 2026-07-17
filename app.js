/* --- APEACH PHOTOBOOTH LOGIC --- */

document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const webcam = document.getElementById('webcam');
  const btnCapture = document.getElementById('btn-capture');
  const btnDownload = document.getElementById('btn-download');
  const btnReset = document.getElementById('btn-reset');
  const countdownOverlay = document.getElementById('countdown-overlay');
  const countdownText = document.getElementById('countdown-text');
  const flashMask = document.getElementById('flash-mask');
  const cameraError = document.getElementById('camera-error');
  const cameraPrompt = document.getElementById('camera-prompt');
  const btnGrantCamera = document.getElementById('btn-grant-camera');
  
  // Dynamic DOM References
  let frameSlots = [];
  const layoutMenu = document.getElementById('layout-menu');
  const stripFrames = document.getElementById('strip-frames');
  
  const btnToggleMenu = document.getElementById('btn-toggle-menu');
  const menuBackdrop = document.getElementById('menu-backdrop');
  const layoutPanel = document.querySelector('.layout-panel');

  if (btnToggleMenu && menuBackdrop && layoutPanel) {
    btnToggleMenu.addEventListener('click', () => {
      layoutPanel.classList.toggle('open');
      menuBackdrop.classList.toggle('open');
      if (layoutPanel.classList.contains('open')) {
        btnToggleMenu.classList.add('hidden');
      } else {
        btnToggleMenu.classList.remove('hidden');
      }
    });

    menuBackdrop.addEventListener('click', () => {
      layoutPanel.classList.remove('open');
      menuBackdrop.classList.remove('open');
      btnToggleMenu.classList.remove('hidden');
    });
  }

  // New DOM References for Upload and Staging Controls
  const btnUploadPhoto = document.getElementById('btn-upload-photo');
  const uploadInput = document.getElementById('upload-input');
  const normalControls = document.getElementById('normal-controls');
  const stagingControls = document.getElementById('staging-controls');
  const zoomSlider = document.getElementById('zoom-slider');
  const zoomValue = document.getElementById('zoom-value');
  const btnConfirmPhoto = document.getElementById('btn-confirm-photo');
  const btnCancelStaging = document.getElementById('btn-cancel-staging');
  const photoStrip = document.getElementById('photo-strip');

  // Background Color Selectors
  const bgRadioChoices = document.querySelectorAll('input[name="bg-color-choice"]');
  const customColorPicker = document.getElementById('custom-color-picker');
  const radioCustomColor = document.getElementById('radio-custom-color');

  // Signature Selectors
  const inputDedication = document.getElementById('input-dedication');
  const stripDedicationEl = document.querySelector('.strip-dedication');

  // Photobooth layouts configuration definition
  const LAYOUTS = {
    '2x6-a': {
      name: '2x6"',
      desc: 'Kiểu A',
      class: 'layout-2x6-3',
      canvasWidth: 1080,
      canvasHeight: 2700,
      slots: [
        { left: 6.3, top: 3.0, width: 87.4, height: 26.0 },
        { left: 6.3, top: 31.0, width: 87.4, height: 26.0 },
        { left: 6.3, top: 59.0, width: 87.4, height: 26.0 }
      ],
      footerY: 2440,
      numPhotos: 3
    },
    '2x6-b': {
      name: '2x6"',
      desc: 'Kiểu B',
      class: 'layout-2x6-4',
      canvasWidth: 1080,
      canvasHeight: 3348,
      slots: [
        { left: 6.3, top: 2.4, width: 87.4, height: 21.15 },
        { left: 6.3, top: 25.0, width: 87.4, height: 21.15 },
        { left: 6.3, top: 47.6, width: 87.4, height: 21.15 },
        { left: 6.3, top: 70.2, width: 87.4, height: 21.15 }
      ],
      footerY: 3088,
      numPhotos: 4
    },
    '4x6-a': {
      name: '4x6"',
      desc: 'Kiểu A',
      class: 'layout-4x6-6',
      canvasWidth: 1200,
      canvasHeight: 1800,
      slots: [
        { left: 5.0, top: 3.0, width: 42.5, height: 25.0 },
        { left: 52.5, top: 3.0, width: 42.5, height: 25.0 },
        { left: 5.0, top: 31.0, width: 42.5, height: 25.0 },
        { left: 52.5, top: 31.0, width: 42.5, height: 25.0 },
        { left: 5.0, top: 59.0, width: 42.5, height: 25.0 },
        { left: 52.5, top: 59.0, width: 42.5, height: 25.0 }
      ],
      footerY: 1540,
      numPhotos: 6
    },
    '4x6-b': {
      name: '4x6"',
      desc: 'Kiểu B',
      class: 'layout-4x6-portrait',
      canvasWidth: 1200,
      canvasHeight: 1800,
      slots: [
        { left: 6.0, top: 4.0, width: 88.0, height: 78.0 }
      ],
      footerY: 1540,
      numPhotos: 1
    },
    '4x6-c': {
      name: '4x6"',
      desc: 'Kiểu C',
      class: 'layout-4x6-landscape',
      canvasWidth: 1800,
      canvasHeight: 1200,
      slots: [
        { left: 4.0, top: 6.0, width: 92.0, height: 76.0 }
      ],
      footerY: 1000,
      numPhotos: 1
    },
    '4x6-d': {
      name: '4x6"',
      desc: 'Kiểu D',
      class: 'layout-4x6-triple',
      canvasWidth: 1800,
      canvasHeight: 1200,
      slots: [
        { left: 4.0, top: 6.0, width: 29.3, height: 76.0 },
        { left: 35.3, top: 6.0, width: 29.3, height: 76.0 },
        { left: 66.7, top: 6.0, width: 29.3, height: 76.0 }
      ],
      footerY: 1000,
      numPhotos: 3
    },
    '4x6-e': {
      name: '4x6"',
      desc: 'Kiểu E',
      class: 'layout-4x6-3a',
      canvasWidth: 1800,
      canvasHeight: 1200,
      slots: [
        { left: 4.0, top: 6.0, width: 44.5, height: 36.5 },
        { left: 4.0, top: 45.5, width: 44.5, height: 36.5 },
        { left: 51.5, top: 45.5, width: 44.5, height: 36.5 }
      ],
      footerY: 1000,
      numPhotos: 3
    },
    '4x6-f': {
      name: '4x6"',
      desc: 'Kiểu F',
      class: 'layout-4x6-3b',
      canvasWidth: 1800,
      canvasHeight: 1200,
      slots: [
        { left: 4.0, top: 6.0, width: 44.5, height: 36.5 },
        { left: 51.5, top: 6.0, width: 44.5, height: 36.5 },
        { left: 4.0, top: 45.5, width: 44.5, height: 36.5 }
      ],
      footerY: 1000,
      numPhotos: 3
    },
    '4x6-g': {
      name: '4x6"',
      desc: 'Kiểu G',
      class: 'layout-4x6-4',
      canvasWidth: 1800,
      canvasHeight: 1200,
      slots: [
        { left: 35.3, top: 6.0, width: 60.7, height: 36.5 },
        { left: 4.0, top: 45.5, width: 29.3, height: 36.5 },
        { left: 35.3, top: 45.5, width: 29.3, height: 36.5 },
        { left: 66.7, top: 45.5, width: 29.3, height: 36.5 }
      ],
      footerY: 1000,
      numPhotos: 4
    },
    '4x6-h': {
      name: '4x6"',
      desc: 'Kiểu H',
      class: 'layout-4x6-2a',
      canvasWidth: 1800,
      canvasHeight: 1200,
      slots: [
        { left: 4.0, top: 6.0, width: 44.5, height: 36.5 },
        { left: 4.0, top: 45.5, width: 44.5, height: 36.5 }
      ],
      footerY: 1000,
      numPhotos: 2
    },
    '4x6-i': {
      name: '4x6"',
      desc: 'Kiểu I',
      class: 'layout-4x6-2b',
      canvasWidth: 1800,
      canvasHeight: 1200,
      slots: [
        { left: 4.0, top: 6.0, width: 44.5, height: 36.5 },
        { left: 51.5, top: 6.0, width: 44.5, height: 36.5 }
      ],
      footerY: 1000,
      numPhotos: 2
    }
  };

  // Application State
  let stream = null;
  let photos = []; // Will store objects: { dataUrl, x, y, scale, baseWidth, baseHeight, initialX, initialY, slotW, slotH }
  let isCapturing = false;
  let compiledDataUrl = null;
  let currentSlotIndex = 0;
  let stagingPhoto = null; // Will temporarily store active photo before confirmation
  let currentBgColor = '#ffffff'; // Stored active background color
  let currentDedication = 'Dành cho Maeve'; // Stored active signature text
  let currentLayoutKey = '2x6-b'; // Default (2x6" Kiểu B)

  // Populate layout menu items
  function initLayoutMenu() {
    layoutMenu.innerHTML = '';
    Object.keys(LAYOUTS).forEach(key => {
      const layout = LAYOUTS[key];
      const item = document.createElement('div');
      item.className = `layout-item ${key === currentLayoutKey ? 'active' : ''}`;
      item.dataset.key = key;

      // Render miniature thumbnail SVG
      const is2x6 = key.startsWith('2x6');
      const isPortrait = key === '4x6-a' || key === '4x6-b';
      const viewBox = is2x6 ? "0 0 32 100" : (isPortrait ? "0 0 66 100" : "0 0 100 66");
      let rectsHtml = '';
      layout.slots.forEach(slot => {
        rectsHtml += `<rect x="${slot.left}%" y="${slot.top}%" width="${slot.width}%" height="${slot.height}%" fill="currentColor" rx="1.5" />`;
      });
      const svgThumb = `<svg class="layout-thumb-svg" viewBox="${viewBox}">${rectsHtml}</svg>`;

      item.innerHTML = `
        <div class="layout-thumb">
          ${svgThumb}
        </div>
        <div class="layout-info">
          <div class="layout-title">${layout.name}</div>
          ${layout.desc ? `<div class="layout-desc">${layout.desc}</div>` : ''}
        </div>
      `;

      item.addEventListener('click', () => {
        if (key === currentLayoutKey) return;
        if (isCapturing || stagingPhoto !== null || photos.length > 0) {
          if (!confirm("Chuyển layout sẽ xóa ảnh đã chụp/tải lên hiện tại. Bạn có chắc chắn muốn đổi dải ảnh không? 🍑")) {
            return;
          }
        }
        changeLayout(key, true);
      });

      layoutMenu.appendChild(item);

      const keys = Object.keys(LAYOUTS);
      const currentIndex = keys.indexOf(key);
      const nextKey = keys[currentIndex + 1];
      if (nextKey) {
        const nextLayout = LAYOUTS[nextKey];
        if (layout.name !== nextLayout.name) {
          const divider = document.createElement('div');
          divider.className = 'menu-divider';
          layoutMenu.appendChild(divider);
        }
      }
    });
  }

  // Handle switching layouts
  function changeLayout(layoutKey, updateHistory = true) {
    if (!LAYOUTS[layoutKey]) return;

    currentLayoutKey = layoutKey;
    const layout = LAYOUTS[layoutKey];

    // Highlight active menu item
    const items = layoutMenu.querySelectorAll('.layout-item');
    items.forEach(item => {
      if (item.dataset.key === layoutKey) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update photo strip CSS class
    photoStrip.className = 'photo-strip';
    photoStrip.classList.add(layout.class);

    // Render slots dynamically
    stripFrames.innerHTML = '';
    layout.slots.forEach((slot, index) => {
      const slotEl = document.createElement('div');
      slotEl.className = 'frame-slot';
      slotEl.dataset.index = index;
      slotEl.style.left = `${slot.left}%`;
      slotEl.style.top = `${slot.top}%`;
      slotEl.style.width = `${slot.width}%`;
      slotEl.style.height = `${slot.height}%`;
      slotEl.innerHTML = `<div class="frame-placeholder">🌸 Khung ${index + 1}</div>`;
      stripFrames.appendChild(slotEl);
    });

    // Re-query frame slots reference array
    frameSlots = document.querySelectorAll('.frame-slot');

    // Reset layout state variables
    photos = [];
    currentSlotIndex = 0;
    stagingPhoto = null;
    compiledDataUrl = null;
    btnDownload.disabled = true;

    if (stream) {
      btnCapture.disabled = false;
    } else {
      btnCapture.disabled = true;
    }
    btnUploadPhoto.disabled = false;
    btnReset.disabled = false;

    // Reset controls UI
    normalControls.classList.remove('hidden');
    stagingControls.classList.add('hidden');
    updateActiveSlotHighlight();

    if (updateHistory) {
      window.location.hash = '/' + layoutKey;
    }
  }

  // Handle Hash URL parsing and routing
  function handleRouting() {
    const hash = window.location.hash.replace(/^#\/?|\/+$/g, '');
    if (LAYOUTS[hash]) {
      changeLayout(hash, false);
    } else {
      // Fallback for '/2x6' or legacy hashes to redirect to default '2x6-b' (Kiểu B)
      if (hash === '2x6' || hash === '2x6-2' || hash === '') {
        changeLayout('2x6-b', false);
        window.location.hash = '/2x6-b';
      } else {
        changeLayout('2x6-b', false);
        window.location.hash = '/2x6-b';
      }
    }
  }

  // Listen to hashchange event for URL hash changes
  window.addEventListener('hashchange', () => {
    handleRouting();
  });

  // Get current date string in format DD/MM/YYYY
  function getCurrentDateString() {
    const today = new Date();
    return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  }

  // Update preview date element dynamically
  function updatePreviewDate() {
    const stripDateEl = document.getElementById('strip-date');
    if (stripDateEl) {
      stripDateEl.textContent = getCurrentDateString();
    }
  }

  // Initial update on page load and start real-time timer (checks every minute)
  updatePreviewDate();
  setInterval(updatePreviewDate, 60000);

  // Disable capture button by default until camera permission is granted
  btnCapture.disabled = true;
  // Upload button is enabled by default so users can use the photobooth even without a camera!
  btnUploadPhoto.disabled = false;

  // Initialize Webcam Connection
  async function initCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      webcam.srcObject = stream;
      cameraPrompt.classList.add('hidden');
      cameraError.classList.add('hidden');
      webcam.classList.remove('hidden');
      btnCapture.disabled = false;
    } catch (err) {
      console.error('Error accessing webcam:', err);
      cameraPrompt.classList.add('hidden');
      cameraError.classList.remove('hidden');
      webcam.classList.add('hidden');
      btnCapture.disabled = true;
    }
  }

  // Highlight the current slot to edit
  function updateActiveSlotHighlight() {
    frameSlots.forEach((slot, index) => {
      if (index === currentSlotIndex) {
        slot.classList.add('active-slot');
      } else {
        slot.classList.remove('active-slot');
      }
    });
  }

  // Initialize and run on startup
  initLayoutMenu();
  handleRouting();
  updateActiveSlotHighlight();

  // Countdown timer logic helper (returns a Promise)
  function runCountdown(seconds) {
    return new Promise(resolve => {
      countdownOverlay.classList.remove('hidden');
      let count = seconds;
      countdownText.textContent = count;

      // Force layout recalculation for keyframe restart
      countdownText.style.animation = 'none';
      countdownText.offsetHeight;
      countdownText.style.animation = null;

      const timer = setInterval(() => {
        count--;
        if (count > 0) {
          countdownText.textContent = count;
          countdownText.style.animation = 'none';
          countdownText.offsetHeight;
          countdownText.style.animation = null;
        } else {
          clearInterval(timer);
          countdownOverlay.classList.add('hidden');
          resolve();
        }
      }, 1000);
    });
  }

  // Initialize staging mode with an image (from webcam capture or upload)
  function initStagingPhoto(dataUrl, index) {
    const slot = frameSlots[index];
    const slotW = slot.clientWidth || 192;
    const slotH = slot.clientHeight || 144;

    const img = new Image();
    img.onload = () => {
      const imgW = img.width;
      const imgH = img.height;
      const rC = slotW / slotH;
      const rI = imgW / imgH;

      let baseWidth, baseHeight;
      if (rI > rC) {
        // Image is wider than container -> cover height
        baseHeight = slotH;
        baseWidth = slotH * rI;
      } else {
        // Image is taller than container -> cover width
        baseWidth = slotW;
        baseHeight = slotW / rI;
      }

      const initialX = (slotW - baseWidth) / 2;
      const initialY = (slotH - baseHeight) / 2;

      stagingPhoto = {
        dataUrl: dataUrl,
        x: 0,
        y: 0,
        scale: 1.0,
        imgWidth: imgW,
        imgHeight: imgH,
        baseWidth: baseWidth,
        baseHeight: baseHeight,
        initialX: initialX,
        initialY: initialY,
        slotW: slotW,
        slotH: slotH
      };

      // Render image dynamically inside the current slot
      slot.innerHTML = '';
      const imgWrapper = document.createElement('div');
      imgWrapper.style.width = '100%';
      imgWrapper.style.height = '100%';
      imgWrapper.style.position = 'relative';
      imgWrapper.style.overflow = 'hidden';

      const imgEl = document.createElement('img');
      imgEl.src = dataUrl;
      imgEl.className = 'captured-image staging';
      imgEl.style.position = 'absolute';
      imgEl.style.width = `${baseWidth}px`;
      imgEl.style.height = `${baseHeight}px`;
      imgEl.style.left = `${initialX}px`;
      imgEl.style.top = `${initialY}px`;
      imgEl.style.transform = `translate(0px, 0px) scale(1)`;
      imgEl.style.transformOrigin = 'center center';

      imgWrapper.appendChild(imgEl);
      slot.appendChild(imgWrapper);

      // Transition to staging controls
      zoomSlider.value = 1.0;
      zoomValue.textContent = '100%';
      normalControls.classList.add('hidden');
      stagingControls.classList.remove('hidden');

      btnCapture.disabled = true;
      btnUploadPhoto.disabled = true;
      btnReset.disabled = false;
    };
    img.src = dataUrl;
  }

  // Capture single frame from video and process mirroring + filters
  function capturePhoto(index) {
    // 1. Trigger camera flash effect
    flashMask.classList.remove('flash-active');
    flashMask.offsetHeight; // reflow to restart animation
    flashMask.classList.add('flash-active');

    // 2. Setup offscreen capture canvas
    const capCanvas = document.createElement('canvas');
    capCanvas.width = 640;
    capCanvas.height = 480;
    const ctx = capCanvas.getContext('2d');

    // 3. Mirror image before drawing to match video preview exactly
    ctx.translate(capCanvas.width, 0);
    ctx.scale(-1, 1);

    // 4. Draw video frame with 4:3 center crop matching the object-fit: cover preview
    const videoW = webcam.videoWidth || 640;
    const videoH = webcam.videoHeight || 480;
    const targetAspect = 4 / 3;
    const streamAspect = videoW / videoH;

    let sX = 0;
    let sY = 0;
    let sWidth = videoW;
    let sHeight = videoH;

    if (streamAspect > targetAspect) {
      sWidth = videoH * targetAspect;
      sX = (videoW - sWidth) / 2;
    } else if (streamAspect < targetAspect) {
      sHeight = videoW / targetAspect;
      sY = (videoH - sHeight) / 2;
    }

    ctx.drawImage(webcam, sX, sY, sWidth, sHeight, 0, 0, capCanvas.width, capCanvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const dataUrl = capCanvas.toDataURL('image/png');
    initStagingPhoto(dataUrl, index);
  }

  // Chụp một ảnh duy nhất khi nhấn nút
  async function startCaptureSequence() {
    const numPhotos = LAYOUTS[currentLayoutKey].numPhotos;
    if (currentSlotIndex >= numPhotos || stagingPhoto !== null) return;

    isCapturing = true;
    btnCapture.disabled = true;
    btnUploadPhoto.disabled = true;
    btnReset.disabled = true;
    btnDownload.disabled = true;

    // Đếm ngược 3, 2, 1
    await runCountdown(3);

    // Chụp và lưu ảnh nháp vào ô tương ứng
    capturePhoto(currentSlotIndex);

    isCapturing = false;
    btnReset.disabled = false;
  }

  // File Upload Logic
  btnUploadPhoto.addEventListener('click', () => {
    const numPhotos = LAYOUTS[currentLayoutKey].numPhotos;
    if (currentSlotIndex >= numPhotos || stagingPhoto !== null) return;
    uploadInput.value = ''; // Reset input to trigger change even for same file
    uploadInput.click();
  });

  uploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Vui lòng tải lên một tệp hình ảnh hợp lệ! 🌸");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      initStagingPhoto(event.target.result, currentSlotIndex);
    };
    reader.readAsDataURL(file);
  });

  // Drag and Drop (Pan) Logic inside frame slots using unified Pointer Events
  let isDragging = false;
  let startDragX = 0;
  let startDragY = 0;

  photoStrip.addEventListener('pointerdown', startDrag);
  window.addEventListener('pointermove', drag);
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  function startDrag(e) {
    if (!stagingPhoto) return;

    const target = e.target;
    if (!target.classList.contains('staging')) return;

    isDragging = true;

    // Pointer Events naturally have clientX and clientY for both mouse and touch!
    startDragX = e.clientX - stagingPhoto.x;
    startDragY = e.clientY - stagingPhoto.y;

    // Capture the pointer to keep receiving events even if the finger moves off-element
    try {
      target.setPointerCapture(e.pointerId);
    } catch (err) {
      console.warn("Could not capture pointer:", err);
    }

    e.preventDefault();
  }

  function drag(e) {
    if (!isDragging || !stagingPhoto) return;

    let newX = e.clientX - startDragX;
    let newY = e.clientY - startDragY;

    // Apply boundaries constraints
    const W = stagingPhoto.baseWidth * stagingPhoto.scale;
    const H = stagingPhoto.baseHeight * stagingPhoto.scale;
    const cW = stagingPhoto.slotW;
    const cH = stagingPhoto.slotH;

    if (stagingPhoto.scale >= 1.0) {
      const limitX = Math.max(0, (W - cW) / 2);
      const limitY = Math.max(0, (H - cH) / 2);
      newX = Math.min(limitX, Math.max(-limitX, newX));
      newY = Math.min(limitY, Math.max(-limitY, newY));
    } else {
      // Allow minor translation when zoomed out, but keep within viewport center
      const limitX = cW / 2;
      const limitY = cH / 2;
      newX = Math.min(limitX, Math.max(-limitX, newX));
      newY = Math.min(limitY, Math.max(-limitY, newY));
    }

    stagingPhoto.x = newX;
    stagingPhoto.y = newY;

    const imgEl = frameSlots[currentSlotIndex].querySelector('.captured-image.staging');
    if (imgEl) {
      imgEl.style.transform = `translate(${newX}px, ${newY}px) scale(${stagingPhoto.scale})`;
    }

    e.preventDefault();
  }

  function endDrag(e) {
    if (isDragging && stagingPhoto) {
      const imgEl = frameSlots[currentSlotIndex].querySelector('.captured-image.staging');
      if (imgEl && e) {
        try {
          imgEl.releasePointerCapture(e.pointerId);
        } catch (err) { }
      }
    }
    isDragging = false;
  }

  // Zoom range input logic
  zoomSlider.addEventListener('input', () => {
    if (!stagingPhoto) return;

    const val = parseFloat(zoomSlider.value);
    stagingPhoto.scale = val;
    zoomValue.textContent = `${Math.round(val * 100)}%`;

    // Re-clamp translation based on new scale
    const W = stagingPhoto.baseWidth * val;
    const H = stagingPhoto.baseHeight * val;
    const cW = stagingPhoto.slotW;
    const cH = stagingPhoto.slotH;

    if (val >= 1.0) {
      const limitX = Math.max(0, (W - cW) / 2);
      const limitY = Math.max(0, (H - cH) / 2);
      stagingPhoto.x = Math.min(limitX, Math.max(-limitX, stagingPhoto.x));
      stagingPhoto.y = Math.min(limitY, Math.max(-limitY, stagingPhoto.y));
    } else {
      const limitX = cW / 2;
      const limitY = cH / 2;
      stagingPhoto.x = Math.min(limitX, Math.max(-limitX, stagingPhoto.x));
      stagingPhoto.y = Math.min(limitY, Math.max(-limitY, stagingPhoto.y));
    }

    const imgEl = frameSlots[currentSlotIndex].querySelector('.captured-image.staging');
    if (imgEl) {
      imgEl.style.transform = `translate(${stagingPhoto.x}px, ${stagingPhoto.y}px) scale(${stagingPhoto.scale})`;
    }
  });

  // Confirm photo logic
  btnConfirmPhoto.addEventListener('click', () => {
    if (!stagingPhoto) return;

    // Save staging photo config to permanent photos array
    photos[currentSlotIndex] = { ...stagingPhoto };

    // Finalize slot preview styling
    const imgEl = frameSlots[currentSlotIndex].querySelector('.captured-image');
    if (imgEl) {
      imgEl.classList.remove('staging');
      imgEl.classList.add('adjusted');
      imgEl.style.cursor = 'default';
    }

    stagingPhoto = null;
    currentSlotIndex++;

    const numPhotos = LAYOUTS[currentLayoutKey].numPhotos;
    if (currentSlotIndex === numPhotos) {
      // Photo strip is completed!
      compilePhotoStrip();
      stagingControls.classList.add('hidden');
      normalControls.classList.remove('hidden');

      btnCapture.disabled = true;
      btnUploadPhoto.disabled = true;
      btnReset.disabled = false;
    } else {
      // Re-enable normal inputs for next slot
      stagingControls.classList.add('hidden');
      normalControls.classList.remove('hidden');

      if (stream) {
        btnCapture.disabled = false;
      }
      btnUploadPhoto.disabled = false;
      btnReset.disabled = false;
    }

    updateActiveSlotHighlight();
  });

  // Cancel/Redo staging photo logic
  btnCancelStaging.addEventListener('click', () => {
    if (!stagingPhoto) return;

    // Clear active slot and put back placeholder
    const slot = frameSlots[currentSlotIndex];
    slot.innerHTML = `<div class="frame-placeholder">🌸 Khung ${currentSlotIndex + 1}</div>`;

    stagingPhoto = null;

    // Re-enable controls
    stagingControls.classList.add('hidden');
    normalControls.classList.remove('hidden');

    if (stream) {
      btnCapture.disabled = false;
    }
    btnUploadPhoto.disabled = false;
    btnReset.disabled = false;
  });

  // Clear slot previews and reset photos array
  function clearPhotos() {
    photos = [];
    currentSlotIndex = 0;
    stagingPhoto = null;
    compiledDataUrl = null;
    btnDownload.disabled = true;

    // Reset background color selections to white
    currentBgColor = '#ffffff';
    photoStrip.style.backgroundColor = '#ffffff';
    bgRadioChoices.forEach(radio => {
      if (radio.value === '#ffffff') {
        radio.checked = true;
      } else {
        radio.checked = false;
      }
    });
    customColorPicker.value = '#ffe0e5';

    // Reset signature text to default
    currentDedication = 'Dành cho Maeve';
    inputDedication.value = 'Dành cho Maeve';
    if (stripDedicationEl) {
      stripDedicationEl.textContent = 'Dành cho Maeve';
    }

    frameSlots.forEach((slot, index) => {
      slot.innerHTML = `<div class="frame-placeholder">🌸 Khung ${index + 1}</div>`;
    });

    stagingControls.classList.add('hidden');
    normalControls.classList.remove('hidden');

    if (stream) {
      btnCapture.disabled = false;
    } else {
      btnCapture.disabled = true;
    }
    btnUploadPhoto.disabled = false;
    btnReset.disabled = false;

    updateActiveSlotHighlight();
  }

  // Draw custom vertical or landscape collage canvas based on layout dimensions
  function compilePhotoStrip() {
    const layout = LAYOUTS[currentLayoutKey];
    const stripCanvas = document.createElement('canvas');
    stripCanvas.width = layout.canvasWidth;
    stripCanvas.height = layout.canvasHeight;
    const ctx = stripCanvas.getContext('2d');

    // 1. Draw solid background color matching web
    ctx.fillStyle = currentBgColor;
    ctx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);

    // 2. Draw subtle border around the canvas
    ctx.lineWidth = Math.max(4, Math.round(stripCanvas.width * 0.007));
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, stripCanvas.width - ctx.lineWidth, stripCanvas.height - ctx.lineWidth);

    // Load all photos as promises
    const loadPromises = photos.map((photoObj, i) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ type: 'photo', img, index: i, ...photoObj });
        img.onerror = reject;
        img.src = photoObj.dataUrl;
      });
    });

    // Also load the footer logo image
    const footerImgPromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ type: 'footer_logo', img });
      img.onerror = () => resolve({ type: 'footer_logo', img: null });
      img.src = 'apeach_footer.png';
    });

    // Wait for all images to be loaded
    Promise.all([...loadPromises, footerImgPromise])
      .then(results => {
        const photosToDraw = results.filter(item => item.type === 'photo');
        const footerLogoItem = results.find(item => item.type === 'footer_logo');
        const footerLogoImg = footerLogoItem ? footerLogoItem.img : null;

        photosToDraw.forEach(item => {
          const slot = layout.slots[item.index];
          // Convert percentages to canvas pixel coordinates
          const frameX = (slot.left / 100) * stripCanvas.width;
          const frameY = (slot.top / 100) * stripCanvas.height;
          const frameW = (slot.width / 100) * stripCanvas.width;
          const frameH = (slot.height / 100) * stripCanvas.height;

          // Fill background of slot
          ctx.fillStyle = '#f7f7f7';
          ctx.beginPath();
          if ('roundRect' in ctx) {
            ctx.roundRect(frameX, frameY, frameW, frameH, 20);
          } else {
            ctx.rect(frameX, frameY, frameW, frameH);
          }
          ctx.fill();

          ctx.save();
          // Create rounded rectangle path for clipping
          ctx.beginPath();
          if ('roundRect' in ctx) {
            ctx.roundRect(frameX, frameY, frameW, frameH, 20);
          } else {
            ctx.rect(frameX, frameY, frameW, frameH);
          }
          ctx.clip();

          // Calculate scaling ratio from slot resolution to high-res canvas resolution
          const scaleRatio = frameW / item.slotW;

          // Target center of final frame
          const centerX = frameX + frameW / 2;
          const centerY = frameY + frameH / 2;

          ctx.translate(centerX, centerY);
          ctx.scale(item.scale, item.scale);

          // Calculate coordinates relative to center
          const finalRelX = (item.initialX - item.slotW / 2) * scaleRatio;
          const finalRelY = (item.initialY - item.slotH / 2) * scaleRatio;
          const finalBaseW = item.baseWidth * scaleRatio;
          const finalBaseH = item.baseHeight * scaleRatio;

          const finalDragX = item.x * scaleRatio;
          const finalDragY = item.y * scaleRatio;

          // Translate based on drag, adjusted for scale
          ctx.translate(finalDragX / item.scale, finalDragY / item.scale);

          // Draw the photo
          ctx.drawImage(item.img, finalRelX, finalRelY, finalBaseW, finalBaseH);
          ctx.restore();

          // Draw frame slot border
          ctx.lineWidth = Math.max(3, Math.round(frameW * 0.005));
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
          ctx.beginPath();
          if ('roundRect' in ctx) {
            ctx.roundRect(frameX, frameY, frameW, frameH, 20);
          } else {
            ctx.rect(frameX, frameY, frameW, frameH);
          }
          ctx.stroke();
        });

        // Draw footer
        drawStripFooter(ctx, stripCanvas, footerLogoImg);
      })
      .catch(err => {
        console.error("Error compiling photo strip:", err);
      });
  }

  // Draw Apeach logo and texts onto the photo strip footer (dynamic based on size)
  function drawStripFooter(ctx, canvas, footerLogoImg) {
    const layout = LAYOUTS[currentLayoutKey];
    const footerY = layout.footerY;
    const is2x6 = currentLayoutKey.startsWith('2x6');
    const isPortrait = currentLayoutKey === '4x6-6' || currentLayoutKey === '4x6-portrait';

    // 1. Margins
    const marginLeft = is2x6 ? 68 : (isPortrait ? 60 : 72);
    const marginRight = canvas.width - marginLeft;

    // 2. Draw dashed divider line
    ctx.strokeStyle = 'rgba(245, 141, 158, 0.25)';
    ctx.lineWidth = Math.max(3, Math.round(canvas.width * 0.004));
    const dashLen = Math.round(canvas.width * 0.013);
    ctx.setLineDash([dashLen, dashLen]);
    ctx.beginPath();
    ctx.moveTo(marginLeft, footerY);
    ctx.lineTo(marginRight, footerY);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // 3. Set layout text scaling sizes
    let titleSize, dateSize, dedicationSize, logoH, titleOffset, dateOffset, dedicationOffset, logoOffset;

    if (is2x6) {
      titleSize = 58;
      dateSize = 36;
      dedicationSize = 32;
      logoH = 180;
      titleOffset = 79;
      dateOffset = 130;
      dedicationOffset = 176;
      logoOffset = 32;
    } else if (isPortrait) {
      titleSize = 50;
      dateSize = 32;
      dedicationSize = 28;
      logoH = 150;
      titleOffset = 75;
      dateOffset = 122;
      dedicationOffset = 165;
      logoOffset = 30;
    } else { // Landscape
      titleSize = 44;
      dateSize = 28;
      dedicationSize = 24;
      logoH = 120;
      titleOffset = 62;
      dateOffset = 100;
      dedicationOffset = 135;
      logoOffset = 22;
    }

    // 4. Draw texts
    // Draw "Apeach Photobooth" logo text
    ctx.fillStyle = '#ffc8c8';
    ctx.font = `700 ${titleSize}px "Fredoka", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('Apeach Photobooth', marginLeft, footerY + titleOffset);

    // Draw Date stamp
    ctx.fillStyle = 'rgba(58, 37, 37, 0.6)';
    ctx.font = `600 ${dateSize}px "Fredoka", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(getCurrentDateString(), marginLeft, footerY + dateOffset);

    // Draw dedication text (signature)
    ctx.fillStyle = 'rgba(58, 37, 37, 0.45)';
    ctx.font = `600 ${dedicationSize}px "Fredoka", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(currentDedication, marginLeft, footerY + dedicationOffset);

    // 5. Draw footer logo image on the right next to the texts
    if (footerLogoImg) {
      const logoW = logoH * (footerLogoImg.width / footerLogoImg.height);
      const logoX = marginRight - logoW; // Align to the right margin
      const logoY = footerY + logoOffset;
      ctx.drawImage(footerLogoImg, logoX, logoY, logoW, logoH);
    }

    // Save finalized URL to trigger downloading
    compiledDataUrl = canvas.toDataURL('image/png');
    btnDownload.disabled = false;
  }

  // Trigger download / export to new page ending in /preview/
  btnDownload.addEventListener('click', () => {
    if (!compiledDataUrl) return;

    // Store compiled strip data URL in sessionStorage
    try {
      sessionStorage.setItem('compiledStrip', compiledDataUrl);

      // Open absolute preview route to prevent path nesting issues on sub-paths
      const newWindow = window.open('/preview/', '_blank');
      if (!newWindow) {
        // Fallback for pop-up blockers
        window.location.href = '/preview/';
      }
    } catch (err) {
      console.warn("sessionStorage or window.open failed, redirecting:", err);
      window.location.href = '/preview/';
    }
  });

  // Background color selection event handlers
  function updateBackgroundColor(color) {
    currentBgColor = color;
    photoStrip.style.backgroundColor = color;

    // Auto re-compile canvas if the photo strip is already complete
    const numPhotos = LAYOUTS[currentLayoutKey].numPhotos;
    if (photos.length === numPhotos) {
      compilePhotoStrip();
    }
  }

  bgRadioChoices.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        updateBackgroundColor(customColorPicker.value);
      } else {
        updateBackgroundColor(e.target.value);
      }
    });
  });

  customColorPicker.addEventListener('input', () => {
    radioCustomColor.checked = true;
    updateBackgroundColor(customColorPicker.value);
  });

  customColorPicker.addEventListener('change', () => {
    radioCustomColor.checked = true;
    updateBackgroundColor(customColorPicker.value);
  });

  // Signature input event handler
  inputDedication.addEventListener('input', (e) => {
    const val = e.target.value;
    currentDedication = val;
    if (stripDedicationEl) {
      stripDedicationEl.textContent = val;
    }
    // Auto re-compile canvas if the photo strip is already complete
    const numPhotos = LAYOUTS[currentLayoutKey].numPhotos;
    if (photos.length === numPhotos) {
      compilePhotoStrip();
    }
  });

  // Reset button trigger
  btnReset.addEventListener('click', () => {
    if (isCapturing) return;
    clearPhotos();
  });

  // Run camera initialization
  btnCapture.addEventListener('click', () => {
    if (isCapturing) return;
    startCaptureSequence();
  });

  // Add listener to grant camera button
  btnGrantCamera.addEventListener('click', initCamera);
});
