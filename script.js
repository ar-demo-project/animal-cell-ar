(() => {
  "use strict";
  const data = {
    1: {
      name: "Robot Alpha",
      desc: "Robot with a glowing visor and chest core.",
      root: "model-1",
      marker: "Hiro",
    },
    2: {
      name: "Titan Mecha",
      desc: "Armored mecha with shoulder cannons.",
      root: "model-2",
      marker: "Kanji",
    },
    3: {
      name: "Motherboard Hub",
      desc: "Miniature motherboard with RAM and expansion slots.",
      root: "model-3",
      marker: "Letter A",
    },
  };
  const state = {
    selected: 1,
    detected: new Set(),
    cameraReady: false,
    starting: false,
  };
  const $ = (id) => document.getElementById(id),
    status = $("status"),
    statusText = $("status-text"),
    startPanel = $("start-panel"),
    startButton = $("start-button"),
    startError = $("start-error"),
    arRoot = $("ar-root"),
    helpPanel = $("help-panel");
  function setStatus(kind, message) {
    status.className = "status" + (kind ? " " + kind : "");
    statusText.textContent = message;
  }
  function setInfo(i) {
    $("model-name").textContent = data[i].name;
    $("model-desc").textContent =
      data[i].desc + " Marker: " + data[i].marker + ".";
  }
  function select(i, fromMarker = false) {
    state.selected = i;
    document.querySelectorAll("[data-select]").forEach((b) => {
      let active = +b.dataset.select === i;
      b.classList.toggle("selected", active);
      b.setAttribute("aria-pressed", String(active));
    });
    setInfo(i);
    if (!fromMarker && state.cameraReady)
      setStatus(
        state.detected.has(i) ? "detected" : "ready",
        state.detected.has(i)
          ? "Detected: " + data[i].name
          : "Selected " + data[i].name + " — scan " + data[i].marker,
      );
  }
  function markerEvent(i, found) {
    if (found) {
      state.detected.add(i);
      select(i, true);
      setStatus("detected", "Detected: " + data[i].name);
    } else {
      state.detected.delete(i);
      if (state.detected.has(state.selected)) {
        setStatus("detected", "Detected: " + data[state.selected].name);
      } else if (state.detected.size) {
        let remaining = [...state.detected].pop();
        select(remaining, true);
        setStatus("detected", "Detected: " + data[remaining].name);
      } else if (state.cameraReady)
        setStatus("ready", "Marker lost — point at a marker");
    }
  }
  if (window.AFRAME) {
    AFRAME.registerComponent("app-marker-events", {
      schema: { index: { type: "int" } },
      init() {
        this.el.addEventListener("markerFound", () =>
          markerEvent(this.data.index, true),
        );
        this.el.addEventListener("markerLost", () =>
          markerEvent(this.data.index, false),
        );
      },
    });
  }
  const scene = $("ar-scene");
  scene.addEventListener("loaded", () => {
    [
      ["marker-robot", 1],
      ["marker-mecha", 2],
      ["marker-board", 3],
    ].forEach(([id, index]) => {
      const marker = $(id);
      if (
        marker &&
        (!marker.components || !marker.components["app-marker-events"])
      )
        marker.setAttribute("app-marker-events", "index: " + index);
    });
  });
  document
    .querySelectorAll("[data-select]")
    .forEach((b) =>
      b.addEventListener("click", () => select(+b.dataset.select)),
    );
  function rotate(degrees) {
    let root = $(data[state.selected].root);
    if (!root) return setStatus("error", "Model unavailable — reload the page");
    let r = root.getAttribute("rotation") || { x: 0, y: 0, z: 0 };
    root.setAttribute("rotation", { x: r.x, y: r.y + degrees, z: r.z });
    setStatus(
      state.detected.has(state.selected) ? "detected" : "ready",
      data[state.selected].name + " rotated",
    );
  }
  $("rotate-left").addEventListener("click", () => rotate(-25));
  $("rotate-right").addEventListener("click", () => rotate(25));
  $("reset").addEventListener("click", () => {
    let root = $(data[state.selected].root);
    root.setAttribute("rotation", "0 0 0");
    root.setAttribute("position", "0 0 0");
    root.setAttribute("scale", "0.55 0.55 0.55");
    setStatus(
      state.detected.has(state.selected) ? "detected" : "ready",
      data[state.selected].name + " reset",
    );
  });
  $("help-button").addEventListener("click", () =>
    helpPanel.classList.remove("hidden"),
  );
  $("close-help").addEventListener("click", () =>
    helpPanel.classList.add("hidden"),
  );
  function cameraError(e) {
    if (e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError")
      return "Camera permission denied. Allow camera access in browser site settings, then reload.";
    if (e?.name === "NotFoundError")
      return "No camera was found on this device.";
    if (e?.name === "NotReadableError")
      return "The camera may be busy in another app. Close other camera apps and retry.";
    return "Camera could not start. Check permission, HTTPS, and internet, then retry.";
  }
  function waitForVideo(ms) {
    return new Promise((resolve) => {
      let start = Date.now();
      (function poll() {
        let v =
          document.querySelector("#ar-root video") ||
          document.querySelector("video#arjs-video") ||
          document.querySelector("video");
        if (v && v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0)
          resolve(true);
        else if (Date.now() - start >= ms) resolve(false);
        else setTimeout(poll, 250);
      })();
    });
  }
  startButton.addEventListener("click", async () => {
    if (state.starting) return;
    state.starting = true;
    startButton.disabled = true;
    startButton.textContent = "Requesting camera…";
    startError.hidden = true;
    let secure =
      window.isSecureContext ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1";
    if (!secure) {
      startError.textContent =
        "Camera access requires HTTPS or localhost. Publish with GitHub Pages or use a local web server.";
      startError.hidden = false;
      setStatus("error", "Secure connection required");
      return resetStart();
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      startError.textContent =
        "This browser does not support camera access. Try Chrome or Safari.";
      startError.hidden = false;
      setStatus("error", "Camera not supported");
      return resetStart();
    }
    try {
      let stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      stream.getTracks().forEach((t) => t.stop());
      arRoot.classList.remove("ar-hidden");
      setStatus("", "Starting AR camera…");
      let ok = await waitForVideo(15000);
      if (!ok) {
        arRoot.classList.add("ar-hidden");
        startError.textContent =
          "AR.js did not start a video feed. Check the site camera permission and internet connection, then retry.";
        startError.hidden = false;
        setStatus("error", "Camera did not start");
        startPanel.classList.remove("hidden");
        return resetStart();
      }
      state.cameraReady = true;
      startPanel.classList.add("hidden");
      setStatus("ready", "Camera started — point at a marker");
    } catch (e) {
      console.error(e);
      startError.textContent = cameraError(e);
      startError.hidden = false;
      setStatus("error", "Camera startup failed");
    } finally {
      if (!state.cameraReady) resetStart();
    }
  });
  function resetStart() {
    state.starting = false;
    startButton.disabled = false;
    startButton.textContent = "Retry Start AR Camera";
  }
  select(1);
  setStatus("", "Ready to start");
})();
