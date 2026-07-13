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
  const frameSlots = document.querySelectorAll('.frame-slot');

  // Application State
  let stream = null;
  let photos = [];
  let isCapturing = false;
  let compiledDataUrl = null;

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
      cameraError.classList.add('hidden');
      webcam.classList.remove('hidden');
    } catch (err) {
      console.error('Error accessing webcam:', err);
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
  });

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

    // 5. Draw video frame
    ctx.drawImage(webcam, 0, 0, capCanvas.width, capCanvas.height);

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
      slot.innerHTML = `<div class="frame-placeholder">🍑 Khung ${index + 1}</div>`;
    });
  }

  // Draw custom vertical 4-cut collage canvas
  function compilePhotoStrip() {
    const stripCanvas = document.createElement('canvas');
    // Set 600px width x 1800px height (aspect ratio 1:3)
    stripCanvas.width = 600;
    stripCanvas.height = 1800;
    const ctx = stripCanvas.getContext('2d');

    // 1. Draw solid cute pastel pink background
    ctx.fillStyle = '#ffc8c8'; // Primary Pink
    ctx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);

    // 2. Draw border decorations around strip edge
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#ff9494'; // Deep Pink
    ctx.strokeRect(6, 6, stripCanvas.width - 12, stripCanvas.height - 12);

    // 3. Layout constants for frames
    const frameW = 500;
    const frameH = 375; // 4:3 Aspect Ratio
    const startX = 50; // Centered: (600 - 500) / 2
    const startY = 80;
    const gap = 32;

    // 4. Draw each captured photo and add white frame borders
    photos.forEach((photoUrl, i) => {
      const img = new Image();
      img.onload = () => {
        const yPos = startY + i * (frameH + gap);

        // Draw photo white backing board
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(startX - 8, yPos - 8, frameW + 16, frameH + 16);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.strokeRect(startX - 8, yPos - 8, frameW + 16, frameH + 16);

        // Draw the image
        ctx.drawImage(img, startX, yPos, frameW, frameH);

        // If this is the last image load, proceed to finalize footer and activate download
        if (i === 3) {
          drawStripFooter(ctx, stripCanvas);
        }
      };
      img.src = photoUrl;
    });
  }

  // Draw Apeach logo and texts onto the photo strip footer
  function drawStripFooter(ctx, canvas) {
    const footerY = 1715;

    // Draw divider dotted/dashed effect
    ctx.strokeStyle = 'rgba(255, 148, 148, 0.4)';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(50, 1690);
    ctx.lineTo(550, 1690);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Draw "APEACH BOOTH" Brand text
    ctx.fillStyle = '#3a2525';
    ctx.font = 'bold 28px "Fredoka", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('APEACH BOOTH 🍑', 55, footerY);

    // Draw Date stamp
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    ctx.fillStyle = 'rgba(58, 37, 37, 0.6)';
    ctx.font = '600 20px "Fredoka", sans-serif';
    ctx.fillText(dateStr, 55, footerY + 35);

    // Draw generated Apeach character image on the right bottom corner
    const footerImg = new Image();
    footerImg.onload = () => {
      // Draw image at right side of footer (width = 90px, height = 90px)
      ctx.drawImage(footerImg, 450, 1695, 90, 90);

      // Save finalized URL to trigger downloading
      compiledDataUrl = canvas.toDataURL('image/png');
      btnDownload.disabled = false;
      btnCapture.disabled = false;
    };
    footerImg.src = 'apeach_footer.png';
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

  // Initialize camera stream on startup
  initCamera();
});
