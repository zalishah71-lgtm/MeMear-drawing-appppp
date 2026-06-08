const camera = document.getElementById("camera");
const imageUpload = document.getElementById("imageUpload");
const imageLayer = document.getElementById("imageLayer");
const traceImage = document.getElementById("traceImage");

const opacitySlider = document.getElementById("opacitySlider");
const thresholdSlider = document.getElementById("thresholdSlider");
const strengthSlider = document.getElementById("strengthSlider");
const sizeSlider = document.getElementById("sizeSlider");
const rotateSlider = document.getElementById("rotateSlider");

const lineBtn = document.getElementById("lineBtn");
const lockBtn = document.getElementById("lockBtn");
const resetBtn = document.getElementById("resetBtn");
const switchCameraBtn = document.getElementById("switchCameraBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const hidePanelBtn = document.getElementById("hidePanelBtn");
const showPanelBtn = document.getElementById("showPanelBtn");
const controlPanel = document.getElementById("controlPanel");
const message = document.getElementById("message");

let cameraFacing = "environment";
let imageLocked = false;
let linesOnly = true;
let originalImage = null;

let imageState = {
  x: window.innerWidth / 2,
  y: window.innerHeight * 0.42,
  scale: 1,
  rotation: 0,
  opacity: 0.85,
  threshold: 205,
  strength: 2.8
};

let isDragging = false;
let startX = 0;
let startY = 0;
let originalX = 0;
let originalY = 0;

async function startCamera() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera API not supported in this browser.");
    }

    if (camera.srcObject) {
      camera.srcObject.getTracks().forEach(track => track.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: cameraFacing }
      },
      audio: false
    });

    camera.srcObject = stream;
    message.style.display = "none";
  } catch (error) {
    message.style.display = "block";
    message.innerText =
      "Camera could not start. Open this from GitHub Pages in Safari/Chrome and allow camera permission.";
    console.error(error);
  }
}

imageUpload.addEventListener("change", function () {
  const file = imageUpload.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();

    img.onload = function () {
      originalImage = img;
      processImage();
      traceImage.style.display = "block";
      updateImage();
    };

    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
});

function processImage() {
  if (!originalImage) return;

  if (!linesOnly) {
    traceImage.src = originalImage.src;
    return;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const maxWidth = 1400;
  let w = originalImage.width;
  let h = originalImage.height;

  if (w > maxWidth) {
    h = Math.round((h * maxWidth) / w);
    w = maxWidth;
  }

  canvas.width = w;
  canvas.height = h;

  ctx.drawImage(originalImage, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const threshold = imageState.threshold;
  const strength = imageState.strength;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const brightness = (r + g + b) / 3;

    if (brightness > threshold) {
      // remove white/light background
      data[i + 3] = 0;
    } else {
      // keep dark lines
      const darkness = 255 - brightness;

      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;

      data[i + 3] = Math.min(255, Math.max(25, darkness * strength));
    }
  }

  ctx.putImageData(imgData, 0, 0);
  traceImage.src = canvas.toDataURL("image/png");
}

function updateImage() {
  imageLayer.style.left = imageState.x + "px";
  imageLayer.style.top = imageState.y + "px";
  imageLayer.style.transform =
    `translate(-50%, -50%) scale(${imageState.scale}) rotate(${imageState.rotation}deg)`;
  traceImage.style.opacity = imageState.opacity;
}

opacitySlider.addEventListener("input", function () {
  imageState.opacity = Number(opacitySlider.value);
  updateImage();
});

thresholdSlider.addEventListener("input", function () {
  imageState.threshold = Number(thresholdSlider.value);
  processImage();
});

strengthSlider.addEventListener("input", function () {
  imageState.strength = Number(strengthSlider.value);
  processImage();
});

sizeSlider.addEventListener("input", function () {
  imageState.scale = Number(sizeSlider.value);
  updateImage();
});

rotateSlider.addEventListener("input", function () {
  imageState.rotation = Number(rotateSlider.value);
  updateImage();
});

imageLayer.addEventListener("pointerdown", function (event) {
  if (imageLocked) return;

  isDragging = true;
  startX = event.clientX;
  startY = event.clientY;
  originalX = imageState.x;
  originalY = imageState.y;
});

window.addEventListener("pointermove", function (event) {
  if (!isDragging || imageLocked) return;

  imageState.x = originalX + (event.clientX - startX);
  imageState.y = originalY + (event.clientY - startY);
  updateImage();
});

window.addEventListener("pointerup", function () {
  isDragging = false;
});

window.addEventListener("pointercancel", function () {
  isDragging = false;
});

lockBtn.addEventListener("click", function () {
  imageLocked = !imageLocked;
  lockBtn.innerText = imageLocked ? "Unlock" : "Lock";
});

lineBtn.addEventListener("click", function () {
  linesOnly = !linesOnly;
  lineBtn.innerText = linesOnly ? "Lines Only ON" : "Lines Only OFF";
  processImage();
});

resetBtn.addEventListener("click", function () {
  imageState = {
    x: window.innerWidth / 2,
    y: window.innerHeight * 0.42,
    scale: 1,
    rotation: 0,
    opacity: 0.85,
    threshold: 205,
    strength: 2.8
  };

  opacitySlider.value = 0.85;
  thresholdSlider.value = 205;
  strengthSlider.value = 2.8;
  sizeSlider.value = 1;
  rotateSlider.value = 0;

  processImage();
  updateImage();
});

switchCameraBtn.addEventListener("click", function () {
  cameraFacing = cameraFacing === "environment" ? "user" : "environment";
  startCamera();
});

fullscreenBtn.addEventListener("click", async function () {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.error(error);
  }
});

hidePanelBtn.addEventListener("click", function () {
  controlPanel.classList.add("hidden");
  showPanelBtn.classList.remove("hidden");
});

showPanelBtn.addEventListener("click", function () {
  controlPanel.classList.remove("hidden");
  showPanelBtn.classList.add("hidden");
});

window.addEventListener("resize", function () {
  updateImage();
});

updateImage();
startCamera();
