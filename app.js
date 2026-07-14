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
  const frameSlots = document.querySelectorAll('.frame-slot');

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

  // Application State
  let stream = null;
  let photos = []; // Will store objects: { dataUrl, x, y, scale, baseWidth, baseHeight, initialX, initialY, slotW, slotH }
  let isCapturing = false;
  let compiledDataUrl = null;
  let currentSlotIndex = 0;
  let stagingPhoto = null; // Will temporarily store active photo before confirmation

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

  // Run on startup
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
      btnReset.disabled = true;
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
    if (currentSlotIndex >= 4 || stagingPhoto !== null) return;
    
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
    if (currentSlotIndex >= 4 || stagingPhoto !== null) return;
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

  // Drag and Drop (Pan) Logic inside frame slots
  let isDragging = false;
  let startDragX = 0;
  let startDragY = 0;

  photoStrip.addEventListener('mousedown', startDrag);
  photoStrip.addEventListener('touchstart', startDrag, { passive: false });

  window.addEventListener('mousemove', drag);
  window.addEventListener('touchmove', drag, { passive: false });

  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchend', endDrag);

  function startDrag(e) {
    if (!stagingPhoto) return;

    const target = e.target;
    if (!target.classList.contains('staging')) return;

    isDragging = true;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    startDragX = clientX - stagingPhoto.x;
    startDragY = clientY - stagingPhoto.y;

    e.preventDefault();
  }

  function drag(e) {
    if (!isDragging || !stagingPhoto) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    let newX = clientX - startDragX;
    let newY = clientY - startDragY;

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

  function endDrag() {
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

    if (currentSlotIndex === 4) {
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

  // Draw custom vertical 4-cut collage canvas
  function compilePhotoStrip() {
    const stripCanvas = document.createElement('canvas');
    stripCanvas.width = 600;
    stripCanvas.height = 1860;
    const ctx = stripCanvas.getContext('2d');

    // 1. Draw solid white background matching web
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);

    // 2. Draw subtle border around the canvas
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.strokeRect(2, 2, stripCanvas.width - 4, stripCanvas.height - 4);

    // 3. Layout constants for frames
    const frameW = 524;
    const frameH = 393;
    const startX = 38;
    const startY = 44;
    const gap = 27;

    // Load all 4 photos as promises
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
          const yPos = startY + item.index * (frameH + gap);

          // Fill background of slot
          ctx.fillStyle = '#f7f7f7';
          ctx.beginPath();
          if ('roundRect' in ctx) {
            ctx.roundRect(startX, yPos, frameW, frameH, 11);
          } else {
            ctx.rect(startX, yPos, frameW, frameH);
          }
          ctx.fill();

          ctx.save();
          // Create rounded rectangle path for clipping
          ctx.beginPath();
          if ('roundRect' in ctx) {
            ctx.roundRect(startX, yPos, frameW, frameH, 11);
          } else {
            ctx.rect(startX, yPos, frameW, frameH);
          }
          ctx.clip();

          // Calculate scaling ratio from slot resolution to high-res canvas resolution
          const scaleRatio = frameW / item.slotW;

          // Target center of final frame
          const centerX = startX + frameW / 2;
          const centerY = yPos + frameH / 2;

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
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
          ctx.beginPath();
          if ('roundRect' in ctx) {
            ctx.roundRect(startX, yPos, frameW, frameH, 11);
          } else {
            ctx.rect(startX, yPos, frameW, frameH);
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

  // Draw Apeach logo and texts onto the photo strip footer
  function drawStripFooter(ctx, canvas, footerLogoImg) {
    const footerY = 1730;

    // Draw dashed divider line
    ctx.strokeStyle = 'rgba(245, 141, 158, 0.2)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(38, footerY);
    ctx.lineTo(562, footerY);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Draw "Apeach Photobooth" logo text
    ctx.fillStyle = '#ffc8c8';
    ctx.font = '700 32px "Fredoka", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Apeach Photobooth', 38, footerY + 16 + 28);

    // Draw Date stamp
    ctx.fillStyle = 'rgba(58, 37, 37, 0.6)';
    ctx.font = '600 20px "Fredoka", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(getCurrentDateString(), 38, footerY + 16 + 28 + 8 + 20);

    // Draw "Dành cho Maeve" dedication text
    ctx.fillStyle = 'rgba(58, 37, 37, 0.45)';
    ctx.font = '600 18px "Fredoka", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Dành cho Maeve', 38, footerY + 16 + 28 + 8 + 20 + 8 + 18);

    // Draw footer logo image on the right next to the texts
    if (footerLogoImg) {
      const logoH = 100; // Height of the footer logo
      const logoW = logoH * (footerLogoImg.width / footerLogoImg.height);
      const logoX = 562 - logoW; // Align to the right margin
      const logoY = footerY + 18; // Vertically align with the text block
      ctx.drawImage(footerLogoImg, logoX, logoY, logoW, logoH);
    }

    // Save finalized URL to trigger downloading
    compiledDataUrl = canvas.toDataURL('image/png');
    btnDownload.disabled = false;
  }

  // Trigger download
  btnDownload.addEventListener('click', () => {
    if (!compiledDataUrl) return;

    const link = document.createElement('a');
    link.download = `apeach_photobooth_${Date.now()}.png`;
    link.href = compiledDataUrl;
    link.click();
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
