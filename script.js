window.appState = {
  activeFocusIndex: 1,      // Active focus model index (1, 2, or 3)
  detectedMarkers: new Set(),// Indices of markers currently in camera field of view
  modelRotations: { 1: 0, 2: 0, 3: 0 }, // Model Y-axis rotation in degrees
  cameraStreamActive: false
};

window.modelData = {
  1: { name: "Robot Alpha", desc: "Interactive Android with Energy Visor & Chest Core", wrapperId: "model-wrapper-1" },
  2: { name: "Titan Mecha", desc: "Heavy Tactical Bipedal Mech with Shoulder Cannons", wrapperId: "model-wrapper-2" },
  3: { name: "Motherboard Hub", desc: "3D Microchip Architecture with RAM & Heat Sink", wrapperId: "model-wrapper-3" }
};

/* ==========================================================================
   A-FRAME CUSTOM TRACKING COMPONENT
   ========================================================================== */
if (typeof AFRAME !== 'undefined') {
  AFRAME.registerComponent('registerevents', {
    schema: { markerId: { type: 'string', default: '' }, markerIndex: { type: 'int', default: 1 } },
    init: function () {
      const el = this.el;
      const index = this.data.markerIndex;
      const name = this.data.markerId;

      el.addEventListener('markerFound', () => {
        window.appState.detectedMarkers.add(index);
        window.appState.activeFocusIndex = index;
        updateStatus('detected', `Detected: ${name}`);
        updateInfoPanel(index);
        highlightTab(index);
      });

      el.addEventListener('markerLost', () => {
        window.appState.detectedMarkers.delete(index);
        if (window.appState.detectedMarkers.size === 0) {
          updateStatus('ready', 'Point camera at a marker');
        } else {
          const remainingIndex = Array.from(window.appState.detectedMarkers)[0];
          window.appState.activeFocusIndex = remainingIndex;
          updateStatus('detected', `Detected: ${window.modelData[remainingIndex].name}`);
          updateInfoPanel(remainingIndex);
          highlightTab(remainingIndex);
        }
      });
    }
  });
}

/* ==========================================================================
   DOM INITIALIZATION & CAMERA PERMISSIONS
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const statusBadge = document.getElementById('status-badge');
  const statusText = document.getElementById('status-text');
  const infoPanel = document.getElementById('info-panel');
  const modelTitle = document.getElementById('active-model-title');
  const modelDesc = document.getElementById('active-model-desc');
  const startModal = document.getElementById('start-modal');
  const guideModal = document.getElementById('guide-modal');
  const cameraErrorBanner = document.getElementById('camera-error-banner');
  const arSceneContainer = document.getElementById('ar-scene-container');
  const startArBtn = document.getElementById('start-ar-btn');

  // Camera Startup Button Event Handler
  if (startArBtn) {
    startArBtn.addEventListener('click', async () => {
      startArBtn.disabled = true;
      startArBtn.textContent = "Requesting Camera Access...";

      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (window.location.protocol !== 'https:' && !isLocalhost) {
        showCameraError("<strong>Security Context Error:</strong> Camera access requires HTTPS hosting (e.g., GitHub Pages) or Localhost.");
        resetStartButton();
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showCameraError("<strong>Unsupported Browser:</strong> Camera API is not supported in this browser.");
        resetStartButton();
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        window.appState.cameraStreamActive = true;
        stream.getTracks().forEach(track => track.stop());

        arSceneContainer.classList.remove('ar-hidden');
        startModal.classList.add('hidden');
        infoPanel.classList.remove('hidden');
        updateStatus('ready', 'Point camera at a marker');
      } catch (err) {
        console.error("Camera Access Error:", err);
        showCameraError("<strong>Camera Access Denied:</strong> Permission was denied or device camera is busy.");
        resetStartButton();
      }
    });
  }

  function showCameraError(msg) {
    if (cameraErrorBanner) {
      cameraErrorBanner.style.display = 'block';
      cameraErrorBanner.innerHTML = msg;
    }
    updateStatus('error', 'Camera Startup Failed');
  }

  function resetStartButton() {
    if (startArBtn) {
      startArBtn.disabled = false;
      startArBtn.textContent = "Retry Starting Camera";
    }
  }

  // Model Tab Selection Switcher
  window.selectModelTab = function(index) {
    window.appState.activeFocusIndex = index;
    highlightTab(index);
    updateInfoPanel(index);

    if (window.appState.detectedMarkers.has(index)) {
      updateStatus('detected', `Detected: ${window.modelData[index].name}`);
    } else {
      updateStatus('ready', `Active Focus: ${window.modelData[index].name}`);
    }
  };

  function highlightTab(index) {
    for (let i = 1; i <= 3; i++) {
      const tab = document.getElementById(`tab-${i}`);
      if (tab) {
        if (i === index) {
          tab.classList.add('active');
          tab.setAttribute('aria-selected', 'true');
        } else {
          tab.classList.remove('active');
          tab.setAttribute('aria-selected', 'false');
        }
      }
    }
  }

  // Transform Controls
  document.getElementById('rotate-left-btn')?.addEventListener('click', () => rotateActiveModel(-25));
  document.getElementById('rotate-right-btn')?.addEventListener('click', () => rotateActiveModel(25));

  function rotateActiveModel(delta) {
    const idx = window.appState.activeFocusIndex;
    window.appState.modelRotations[idx] = (window.appState.modelRotations[idx] + delta) % 360;
    const targetWrapper = document.getElementById(window.modelData[idx].wrapperId);
    if (targetWrapper) targetWrapper.setAttribute('rotation', `0 ${window.appState.modelRotations[idx]} 0`);
  }

  document.getElementById('reset-btn')?.addEventListener('click', () => {
    const idx = window.appState.activeFocusIndex;
    window.appState.modelRotations[idx] = 0;
    const targetWrapper = document.getElementById(window.modelData[idx].wrapperId);
    if (targetWrapper) {
      targetWrapper.setAttribute('rotation', '0 0 0');
      targetWrapper.setAttribute('position', '0 0 0');
      targetWrapper.setAttribute('scale', '0.6 0.6 0.6');
    }
    updateStatus('ready', `Reset ${window.modelData[idx].name} transform`);
  });

  // Modal Handlers
  document.getElementById('help-btn')?.addEventListener('click', () => guideModal?.classList.remove('hidden'));
  document.getElementById('close-guide-btn')?.addEventListener('click', () => guideModal?.classList.add('hidden'));

  function updateStatus(type, message) {
    if (!statusText || !statusBadge) return;
    statusText.textContent = message;
    statusBadge.className = 'status-badge';
    if (type === 'ready') statusBadge.classList.add('status-ready');
    else if (type === 'detected') statusBadge.classList.add('status-detected');
    else if (type === 'error') statusBadge.classList.add('status-error');
  }

  function updateInfoPanel(index) {
    const data = window.modelData[index];
    if (data && modelTitle && modelDesc) {
      modelTitle.textContent = data.name;
      modelDesc.textContent = data.desc;
    }
  }
});