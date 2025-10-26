// ==================== PHOTO BOOTH FUNCTIONALITY ====================

class PhotoBooth {
  constructor() {
    this.stream = null;
    this.currentFrame = 'pastel-pink';
    this.currentShape = 'square';
    this.currentFilter = 'none';
    this.capturedImageData = null;
    this.capturedPhotos = []; // Array to store 3 photos
    this.currentPhotoIndex = 0; // Track which photo (0-2)
    this.maxPhotos = 3;
    
    this.initElements();
    this.attachEventListeners();
  }

  initElements() {
    this.container = document.getElementById('photoBooth');
    this.video = document.getElementById('cameraPreview');
    this.canvas = document.getElementById('photoCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.countdown = document.getElementById('countdown');
    this.polaroidStrip = document.getElementById('polaroidStrip');
    
    // Strip preview elements
    this.stripPreview = document.getElementById('stripPreview');
    this.stripPreviewCanvas = document.getElementById('stripPreviewCanvas');
    
    this.captureBtn = document.getElementById('captureBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.downloadAllBtn = document.getElementById('downloadAllBtn');
    this.downloadStripBtn = document.getElementById('downloadStripBtn');
    this.resetStripBtn = document.getElementById('resetStripBtn');
    this.closeBtn = document.getElementById('closeBoothBtn');
    
    this.frameButtons = document.querySelectorAll('.frame-btn');
    this.shapeButtons = document.querySelectorAll('.shape-btn');
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.sparklesContainer = document.querySelector('.sparkles-container');
    this.cameraSection = document.querySelector('.camera-section');
    this.boothControls = document.querySelector('.booth-controls');
    this.photoCountText = document.getElementById('currentPhoto');
    this.counterDots = document.querySelectorAll('.counter-dots .dot');
    
    this.polaroidSlots = [
      document.getElementById('polaroid1'),
      document.getElementById('polaroid2'),
      document.getElementById('polaroid3')
    ];
  }

  attachEventListeners() {
    // Frame selection
    this.frameButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.selectFrame(e.target.dataset.frame));
    });

    // Filter selection
    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.selectFilter(e.target.dataset.filter));
    });

    // Action buttons
    this.captureBtn.addEventListener('click', () => this.startCapture());
    this.resetBtn.addEventListener('click', () => this.reset());
    this.downloadAllBtn.addEventListener('click', () => this.downloadAllPhotos());
    this.downloadStripBtn.addEventListener('click', () => this.downloadVerticalStrip());
    this.resetStripBtn.addEventListener('click', () => this.reset());
    this.closeBtn.addEventListener('click', () => this.close());
  }

  async open() {
    this.container.classList.add('active');
    await this.startCamera();
  }

  close() {
    this.container.classList.remove('active');
    this.stopCamera();
    this.reset();
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      this.video.srcObject = this.stream;
      this.video.style.display = 'block';
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please ensure you have granted camera permissions.');
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  toast(message) {
    try {
      const el = document.createElement('div');
      el.textContent = message;
      el.style.position = 'fixed';
      el.style.bottom = '20px';
      el.style.left = '50%';
      el.style.transform = 'translateX(-50%)';
      el.style.background = 'rgba(0,0,0,0.8)';
      el.style.color = '#fff';
      el.style.padding = '10px 16px';
      el.style.borderRadius = '999px';
      el.style.fontSize = '14px';
      el.style.zIndex = '9999';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    } catch {}
  }

  selectFrame(frame) {
    this.currentFrame = frame;
    this.frameButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-frame="${frame}"]`).classList.add('active');
  }

  selectShape(shape) {
    this.currentShape = shape;
    this.shapeButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-shape="${shape}"]`).classList.add('active');
  }

  selectFilter(filter) {
    this.currentFilter = filter;
    this.filterButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // Apply filter preview to video
    this.applyFilterToVideo();
  }

  applyFilterToVideo() {
    const filters = {
      'none': 'none',
      'vintage': 'sepia(0.5) contrast(1.2) brightness(0.9)',
      'bw': 'grayscale(1)',
      'sepia': 'sepia(1)',
      'cool': 'hue-rotate(180deg) saturate(1.5)',
      'warm': 'hue-rotate(-20deg) saturate(1.3) brightness(1.1)',
      'dreamy': 'blur(0.5px) brightness(1.2) saturate(0.8) contrast(0.9)'
    };
    
    this.video.style.filter = filters[this.currentFilter] || 'none';
  }

  async startCapture() {
    // Check if we've reached max photos
    if (this.capturedPhotos.length >= this.maxPhotos) {
      alert('You already captured 3 photos! Download them or start over.');
      return;
    }

    // Disable capture button during countdown
    this.captureBtn.disabled = true;

    // Countdown 3, 2, 1
    for (let i = 3; i > 0; i--) {
      this.countdown.textContent = i;
      this.countdown.classList.add('show');
      await this.wait(1000);
      this.countdown.classList.remove('show');
      if (i > 1) await this.wait(200);
    }

    // Show smile message
    this.countdown.textContent = '😊';
    this.countdown.classList.add('show');
    await this.wait(500);
    
    // Capture!
    this.capturePhoto();
    
    this.countdown.classList.remove('show');
    this.captureBtn.disabled = false;
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  capturePhoto() {
    // Check if we've reached max photos
    if (this.capturedPhotos.length >= this.maxPhotos) {
      return;
    }

    // Set canvas size
    const rect = this.video.getBoundingClientRect();
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;

    // Draw video frame
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

    // Apply filter first
    this.applyFilterToCanvas();

    // Apply shape mask
    this.applyShapeMask();

  // Stickers are not applied during capture anymore; they are added later on the strip

    // Save photo data
    const photoData = {
      dataUrl: this.canvas.toDataURL('image/png'),
      frame: this.currentFrame,
      shape: this.currentShape,
      filter: this.currentFilter,
      timestamp: Date.now()
    };
    
    const photoIndex = this.capturedPhotos.length;
    this.capturedPhotos.push(photoData);

    // Display as Polaroid in the strip
    this.displayPolaroid(photoData, photoIndex);

    // Update photo counter
    this.updatePhotoCounter();

    // Update buttons based on photo count
    if (this.capturedPhotos.length === this.maxPhotos) {
      this.captureBtn.style.display = 'none';
      this.resetBtn.style.display = 'none';
      this.downloadAllBtn.style.display = 'none';
      this.captureBtn.disabled = true;
      
      // Show strip preview
      this.showStripPreview();

      // Stop camera and hide all capture UI
      this.stopCamera();
      if (this.cameraSection) this.cameraSection.style.display = 'none';
      if (this.polaroidStrip) this.polaroidStrip.style.display = 'none';
      if (this.boothControls) this.boothControls.style.display = 'none';
      
      // Scroll strip preview into view
      setTimeout(() => {
        if (this.stripPreview && this.stripPreview.scrollIntoView) {
          this.stripPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }

    // Sparkles animation
    this.createSparkles(window.innerWidth / 2, window.innerHeight / 2);
  }

  displayPolaroid(photoData, index) {
    const polaroidSlot = this.polaroidSlots[index];
    if (!polaroidSlot) return;

    // Add printing animation
    polaroidSlot.classList.add('printing');

    // Clear placeholder and add image
    setTimeout(() => {
      polaroidSlot.innerHTML = `
        <img src="${photoData.dataUrl}" class="polaroid-image" alt="Photo ${index + 1}">
        <div class="polaroid-caption">Happy Birthday Meggu! 💖</div>
      `;
      
      // Add developing effect
      polaroidSlot.classList.add('developing');
      polaroidSlot.classList.remove('printing');
      
      // Remove developing effect after animation
      setTimeout(() => {
        polaroidSlot.classList.remove('developing');
      }, 3000);
    }, 800);
  }

  applyFilterToCanvas() {
    if (this.currentFilter === 'none') return;

    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    switch(this.currentFilter) {
      case 'bw':
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = data[i + 1] = data[i + 2] = gray;
        }
        break;
      
      case 'sepia':
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
          data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
          data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
        break;
      
      case 'vintage':
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189)) * 1.1;
          data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168)) * 1.05;
          data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131)) * 0.9;
        }
        break;
      
      case 'cool':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(0, data[i] - 20); // Reduce red
          data[i + 2] = Math.min(255, data[i + 2] + 20); // Increase blue
        }
        break;
      
      case 'warm':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] + 20); // Increase red
          data[i + 1] = Math.min(255, data[i + 1] + 10); // Slight green
          data[i + 2] = Math.max(0, data[i + 2] - 20); // Reduce blue
        }
        break;
      
      case 'dreamy':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.2);
          data[i + 1] = Math.min(255, data[i + 1] * 1.1);
          data[i + 2] = Math.min(255, data[i + 2] * 1.05);
        }
        break;
      
      case 'sunset':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.3); // Boost red
          data[i + 1] = Math.min(255, data[i + 1] * 0.95); // Slight orange
          data[i + 2] = Math.max(0, data[i + 2] * 0.7); // Reduce blue
        }
        break;
      
      case 'ocean':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(0, data[i] * 0.8); // Reduce red
          data[i + 1] = Math.min(255, data[i + 1] * 1.1); // Boost green
          data[i + 2] = Math.min(255, data[i + 2] * 1.3); // Boost blue
        }
        break;
      
      case 'rose':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.25 + 20); // Boost red
          data[i + 1] = Math.min(255, data[i + 1] * 0.95); // Slight reduce green
          data[i + 2] = Math.min(255, data[i + 2] * 1.1); // Slight boost blue
        }
        break;
      
      case 'lavender':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.15 + 15); // Boost red
          data[i + 1] = Math.min(255, data[i + 1] * 1.05); // Slight green
          data[i + 2] = Math.min(255, data[i + 2] * 1.25 + 20); // Boost blue/purple
        }
        break;
      
      case 'candy':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.3 + 25); // Bright red/pink
          data[i + 1] = Math.min(255, data[i + 1] * 1.2 + 15); // Bright green
          data[i + 2] = Math.min(255, data[i + 2] * 1.25 + 20); // Bright blue
        }
        break;
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  updatePhotoCounter() {
    const count = this.capturedPhotos.length;
    this.photoCountText.textContent = count;
    
    // Update dots
    this.counterDots.forEach((dot, index) => {
      if (index < count) {
        dot.classList.add('completed');
        dot.classList.remove('active');
      } else if (index === count) {
        dot.classList.add('active');
      }
    });
  }



  applyShapeMask() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw original image to temp canvas
    tempCtx.drawImage(this.canvas, 0, 0);

    // Clear main canvas and create shape mask
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const size = Math.min(this.canvas.width, this.canvas.height) * 0.9;

    this.ctx.beginPath();
    
    switch(this.currentShape) {
      case 'circle':
        this.ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        break;
      case 'heart':
        this.drawHeartShape(centerX, centerY, size / 2);
        break;
      case 'square':
      default:
        this.ctx.rect(
          (this.canvas.width - size) / 2,
          (this.canvas.height - size) / 2,
          size,
          size
        );
    }

    this.ctx.closePath();
    this.ctx.clip();
    this.ctx.drawImage(tempCanvas, 0, 0);
    this.ctx.restore();
  }

  drawHeartShape(x, y, size) {
    const ctx = this.ctx;
    const topCurveHeight = size * 0.3;
    
    ctx.moveTo(x, y + topCurveHeight);
    
    // Top left curve
    ctx.bezierCurveTo(
      x, y, 
      x - size / 2, y, 
      x - size / 2, y + topCurveHeight
    );
    
    // Bottom left curve
    ctx.bezierCurveTo(
      x - size / 2, y + (size + topCurveHeight) / 2, 
      x, y + (size + topCurveHeight) / 1.2, 
      x, y + size
    );
    
    // Bottom right curve
    ctx.bezierCurveTo(
      x, y + (size + topCurveHeight) / 1.2,
      x + size / 2, y + (size + topCurveHeight) / 2,
      x + size / 2, y + topCurveHeight
    );
    
    // Top right curve
    ctx.bezierCurveTo(
      x + size / 2, y,
      x, y,
      x, y + topCurveHeight
    );
  }





  getFrameColor(frame) {
    const colors = {
      'pastel-pink': '#ffc0cb',
      'strawberry-red': '#ff4757',
      'pastel-blue': '#b0e0e6',
      'pastel-purple': '#dda0dd',
      'pastel-mint': '#b0f2b6',
      'pastel-peach': '#ffdab9'
    };
    return colors[frame || this.currentFrame] || '#ffc0cb';
  }

  // ========== STRIP PREVIEW WITH STICKERS ==========
  
  showStripPreview() {
    this.stripPreview.style.display = 'block';
    // Skip generating canvas preview - just show the buttons on pastel background
  }

  downloadAllPhotos() {
    if (this.capturedPhotos.length === 0) {
      alert('No photos to download!');
      return;
    }

    // Create vertical strip
    this.downloadVerticalStrip();
    
    // Sparkles!
    this.createSparkles(window.innerWidth / 2, window.innerHeight / 2);
  }

  downloadVerticalStrip() {
    const photoWidth = 400;
    const photoHeight = 400;
    const spacing = 20;
    const padding = 30;
    
    // Calculate total strip dimensions
    const stripWidth = photoWidth + (padding * 2);
    const stripHeight = photoHeight * this.capturedPhotos.length + 
                        spacing * (this.capturedPhotos.length - 1) + (padding * 2);
    
    // Create strip canvas
    const stripCanvas = document.createElement('canvas');
    stripCanvas.width = stripWidth;
    stripCanvas.height = stripHeight;
    const stripCtx = stripCanvas.getContext('2d');
    
    // Draw pink gradient background
    const gradient = stripCtx.createLinearGradient(0, 0, 0, stripHeight);
    gradient.addColorStop(0, '#ffeef8');
    gradient.addColorStop(1, '#fff5f7');
    stripCtx.fillStyle = gradient;
    stripCtx.fillRect(0, 0, stripWidth, stripHeight);
    
    // Counter for loaded images
    let loadedCount = 0;
    const totalPhotos = this.capturedPhotos.length;
    
    // Draw each photo
    this.capturedPhotos.forEach((photoData, index) => {
      const img = new Image();
      img.onload = () => {
        const yPos = padding + (index * (photoHeight + spacing));
        
        // Calculate dimensions to maintain aspect ratio
        let drawWidth = photoWidth;
        let drawHeight = photoHeight;
        let drawX = padding;
        let drawY = yPos;
        
        // Calculate aspect ratio
        const imgAspect = img.width / img.height;
        const targetAspect = photoWidth / photoHeight;
        
        if (imgAspect > targetAspect) {
          // Image is wider - fit to height
          drawHeight = photoHeight;
          drawWidth = drawHeight * imgAspect;
          drawX = padding + (photoWidth - drawWidth) / 2;
        } else {
          // Image is taller - fit to width
          drawWidth = photoWidth;
          drawHeight = drawWidth / imgAspect;
          drawY = yPos + (photoHeight - drawHeight) / 2;
        }
        
        // Draw photo with frame
        stripCtx.save();
        
        // Create clipping path based on shape
        stripCtx.beginPath();
        const x = padding;
        const y = yPos;
        
        if (photoData.shape === 'circle') {
          stripCtx.arc(x + photoWidth/2, y + photoHeight/2, photoWidth/2, 0, Math.PI * 2);
        } else if (photoData.shape === 'heart') {
          this.drawHeartPath(stripCtx, x + photoWidth/2, y + photoHeight/2, photoWidth/2);
        } else {
          stripCtx.rect(x, y, photoWidth, photoHeight);
        }
        stripCtx.clip();
        
        // Draw the photo with proper aspect ratio (cover the area)
        // Use cover approach - fill the entire area
        const scale = Math.max(photoWidth / img.width, photoHeight / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = x + (photoWidth - scaledWidth) / 2;
        const offsetY = y + (photoHeight - scaledHeight) / 2;
        
        stripCtx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
        stripCtx.restore();
        
        // Draw frame border
        stripCtx.strokeStyle = this.getFrameColor(photoData.frame);
        stripCtx.lineWidth = 8;
        stripCtx.beginPath();
        if (photoData.shape === 'circle') {
          stripCtx.arc(x + photoWidth/2, y + photoHeight/2, photoWidth/2, 0, Math.PI * 2);
        } else if (photoData.shape === 'heart') {
          this.drawHeartPath(stripCtx, x + photoWidth/2, y + photoHeight/2, photoWidth/2);
        } else {
          stripCtx.rect(x, y, photoWidth, photoHeight);
        }
        stripCtx.stroke();
        
        loadedCount++;
        
        // When all photos are loaded, add title and trigger download
        if (loadedCount === totalPhotos) {
          // Add "Happy Birthday Meggu! 🎂💖" at the bottom
          stripCtx.fillStyle = '#ff69b4';
          stripCtx.font = 'bold 32px Arial, sans-serif';
          stripCtx.textAlign = 'center';
          stripCtx.fillText(
            'Happy Birthday Meggu! 🎂💖',
            stripWidth / 2,
            stripHeight - 15
          );
          
          const link = document.createElement('a');
          link.download = 'meggu-birthday-polaroid-strip.png';
          link.href = stripCanvas.toDataURL('image/png');
          link.click();
          
          alert(`Downloaded your vertical Polaroid strip! 🎉`);
        }
      };
      img.src = photoData.dataUrl;
    });
  }

  drawHeartPath(ctx, cx, cy, size) {
    // Make heart as big as circle (2x bigger, fills the space like circle does)
    const scale = 2.0;
    const yOffset = -size * 0.05; // Slight shift up for perfect centering
    
    ctx.moveTo(cx, cy + yOffset + (size * scale / 2.5));
    ctx.bezierCurveTo(
      cx, cy + yOffset - (size * scale / 8),
      cx - (size * scale / 1.3), cy + yOffset - (size * scale / 1.3),
      cx, cy + yOffset - (size * scale * 0.9)
    );
    ctx.bezierCurveTo(
      cx + (size * scale / 1.3), cy + yOffset - (size * scale / 1.3),
      cx, cy + yOffset - (size * scale / 8),
      cx, cy + yOffset + (size * scale / 2.5)
    );
  }

  downloadSinglePhoto(photoData, number) {
    // Create a download canvas with the polaroid
    const downloadCanvas = document.createElement('canvas');
    const downloadCtx = downloadCanvas.getContext('2d');
    
    // Create temp image from photo data
    const img = new Image();
    img.onload = () => {
      // Set size (Polaroid with padding)
      const padding = 40;
      const bottomPadding = 100;
      downloadCanvas.width = img.width + (padding * 2);
      downloadCanvas.height = img.height + padding + bottomPadding;

      // Draw frame background
      downloadCtx.fillStyle = this.getFrameColor(photoData.frame);
      downloadCtx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

      // Draw photo
      downloadCtx.drawImage(img, padding, padding);

      // Draw caption
      downloadCtx.fillStyle = '#666';
      downloadCtx.font = '40px cursive';
      downloadCtx.textAlign = 'center';
      downloadCtx.fillText(
        `🎂 Photo ${number}/3 - Happy Birthday Meggu! 💖`,
        downloadCanvas.width / 2,
        img.height + padding + 60
      );

      // Trigger download
      const link = document.createElement('a');
      link.download = `meggu-birthday-photo-${number}-${photoData.timestamp}.png`;
      link.href = downloadCanvas.toDataURL('image/png');
      link.click();
    };
    
    img.src = photoData.dataUrl;
  }



  createSparkles(x, y) {
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;
        
        sparkle.style.left = (x + offsetX) + 'px';
        sparkle.style.top = (y + offsetY) + 'px';
        
        this.sparklesContainer.appendChild(sparkle);
        
        setTimeout(() => sparkle.remove(), 1000);
      }, i * 50);
    }
  }

  reset() {
    // Hide strip preview
    if (this.stripPreview) {
      this.stripPreview.style.display = 'none';
    }
    
    // Reset photos array
    this.capturedPhotos = [];
    this.currentPhotoIndex = 0;
    
    // Reset Polaroid slots to placeholders
    this.polaroidSlots.forEach((slot, index) => {
      slot.innerHTML = `
        <div class="polaroid-placeholder">
          <span>📷</span>
          <p>Photo ${index + 1}</p>
        </div>
      `;
      slot.classList.remove('printing', 'developing');
      // Reset rotation
      if (index === 0) slot.style.transform = 'rotate(-3deg)';
      if (index === 1) slot.style.transform = 'rotate(1deg)';
      if (index === 2) slot.style.transform = 'rotate(-2deg)';
    });
    
    // Reset UI
    this.video.style.filter = 'none';
    this.captureBtn.style.display = 'block';
    this.captureBtn.disabled = false;
    this.resetBtn.style.display = 'none';
    this.downloadAllBtn.style.display = 'none';

    // Restore capture UI visibility
    if (this.cameraSection) this.cameraSection.style.display = '';
    if (this.polaroidStrip) this.polaroidStrip.style.display = '';
    if (this.boothControls) this.boothControls.style.display = '';
    
    // Restart camera for new session
    this.startCamera();
    
    // Reset counter
    this.photoCountText.textContent = '1';
    this.counterDots.forEach((dot, index) => {
      dot.classList.remove('completed', 'active');
      if (index === 0) dot.classList.add('active');
    });
  }
}

// Initialize photo booth
const photoBooth = new PhotoBooth();

// Make it accessible globally
window.photoBooth = photoBooth;
