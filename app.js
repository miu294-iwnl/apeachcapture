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

  // Application State
  let stream = null;
  let photos = [];
  let isCapturing = false;
  let compiledDataUrl = null;

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

    // 3. No filter applied

    // 4. Mirror image before drawing to match video preview exactly
    ctx.translate(capCanvas.width, 0);
    ctx.scale(-1, 1);

    // 5. Draw video frame with 4:3 center crop matching the object-fit: cover preview
    const videoW = webcam.videoWidth || 640;
    const videoH = webcam.videoHeight || 480;
    const targetAspect = 4 / 3;
    const streamAspect = videoW / videoH;
    
    let sX = 0;
    let sY = 0;
    let sWidth = videoW;
    let sHeight = videoH;

    if (streamAspect > targetAspect) {
      // Stream is wider (e.g. 16:9), crop the sides
      sWidth = videoH * targetAspect;
      sX = (videoW - sWidth) / 2;
    } else if (streamAspect < targetAspect) {
      // Stream is taller, crop the top/bottom
      sHeight = videoW / targetAspect;
      sY = (videoH - sHeight) / 2;
    }

    ctx.drawImage(webcam, sX, sY, sWidth, sHeight, 0, 0, capCanvas.width, capCanvas.height);

    // 6. Reset transformations
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 7. Get Data URL
    const dataUrl = capCanvas.toDataURL('image/png');
    photos.push(dataUrl);

    // 8. Update specific preview slot on the strip
    const slot = frameSlots[index];
    slot.innerHTML = ''; // Clear placeholder
    const img = document.createElement('img');
    img.src = dataUrl;
    img.className = 'captured-image';
    slot.appendChild(img);
  }

  // Chụp một ảnh duy nhất khi nhấn nút
  async function startCaptureSequence() {
    if (photos.length >= 4) return; // Đã chụp đủ 4 ảnh thì không chụp thêm
    
    isCapturing = true;
    btnCapture.disabled = true;
    btnReset.disabled = true;
    btnDownload.disabled = true;
    
    const currentIndex = photos.length;
    
    // Đếm ngược 3, 2, 1
    await runCountdown(3);
    
    // Chụp và lưu ảnh vào ô tương ứng
    capturePhoto(currentIndex);

    isCapturing = false;
    btnReset.disabled = false;
    
    if (photos.length === 4) {
      // Nếu đã chụp đủ 4 ảnh thì tự động ghép dải ảnh và tải về
      compilePhotoStrip();
      btnCapture.disabled = true; // Khóa nút chụp lại vì đã đủ ảnh
    } else {
      btnCapture.disabled = false; // Vẫn còn ô trống thì mở lại nút chụp để chụp tấm tiếp theo
    }
  }

  // Clear slot previews and reset photos array
  function clearPhotos() {
    photos = [];
    compiledDataUrl = null;
    btnDownload.disabled = true;
    
    frameSlots.forEach((slot, index) => {
      slot.innerHTML = `<div class="frame-placeholder">🌸 Khung ${index + 1}</div>`;
    });
  }

  // Draw custom vertical 4-cut collage canvas
  function compilePhotoStrip() {
    const stripCanvas = document.createElement('canvas');
    // Set 600px width x 1860px height to accommodate the date in the footer
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

    // 3. Layout constants for frames (without header, starts closer to top)
    const frameW = 524;
    const frameH = 393; // 4:3 Aspect Ratio matching web
    const startX = 38; // Left/right margin
    const startY = 44; // Starts at 44px top padding
    const gap = 27;

    // Load all 4 photos as promises
    const loadPromises = photos.map((photoUrl, i) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ img, index: i });
        img.onerror = reject;
        img.src = photoUrl;
      });
    });

    // Wait for all images to be loaded
    Promise.all(loadPromises)
      .then(photoResults => {
        // Draw each photo
        photoResults.forEach(item => {
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

          // Draw the photo
          ctx.drawImage(item.img, startX, yPos, frameW, frameH);
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
        drawStripFooter(ctx, stripCanvas);
      })
      .catch(err => {
        console.error("Error compiling photo strip:", err);
      });
  }

  // Draw Apeach logo and texts onto the photo strip footer
  function drawStripFooter(ctx, canvas) {
    const footerY = 1730; // Placed 33px below the last photo (1697 + 33)

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
    ctx.fillStyle = '#ffc8c8'; // --primary-pink
    ctx.font = '700 32px "Fredoka", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Apeach Photobooth', 38, footerY + 16 + 28);

    // Draw Date stamp
    ctx.fillStyle = 'rgba(58, 37, 37, 0.6)';
    ctx.font = '600 20px "Fredoka", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(getCurrentDateString(), 38, footerY + 16 + 28 + 8 + 20);

    // Draw "Dành cho Maeve" dedication text
    ctx.fillStyle = 'rgba(58, 37, 37, 0.45)'; // --text-dark with opacity
    ctx.font = '600 18px "Fredoka", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Dành cho Maeve', 38, footerY + 16 + 28 + 8 + 20 + 8 + 18);

    // Save finalized URL to trigger downloading
    compiledDataUrl = canvas.toDataURL('image/png');
    btnDownload.disabled = false;
    btnCapture.disabled = false;
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
    btnCapture.disabled = false;
  });

  // Run camera initialization
  btnCapture.addEventListener('click', () => {
    if (isCapturing) return;
    startCaptureSequence();
  });

  // Add listener to grant camera button
  btnGrantCamera.addEventListener('click', initCamera);
});
