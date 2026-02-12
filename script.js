import {
  FilesetResolver,
  FaceLandmarker,
  HandLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById("webcam");
const popup = document.getElementById("popup");
const music = document.getElementById("music");
const smokeImage = document.getElementById("smokeImage");
const cakeImage = document.getElementById("cakeImage");
const envelope = document.getElementById("envelope");
const messagePopup = document.getElementById("messagePopup");
const closeMessageBtn = document.getElementById("closeMessageBtn");


let faceLandmarker;
let handLandmarker;
let candleLit = false;

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: "user"
    }
  });
  video.srcObject = stream;
  await video.play();
}

async function loadModels() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
    },
    runningMode: "VIDEO"
  });

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
    },
    runningMode: "VIDEO",
    numHands: 1
  });
}

function detect() {
  const now = Date.now();
  const faceResults = faceLandmarker.detectForVideo(video, now);
  const handResults = handLandmarker.detectForVideo(video, now);

  detectPointingUp(handResults);
  detectBlow(faceResults);

  requestAnimationFrame(detect);
}

function detectPointingUp(results) {
  if (!results.landmarks.length || candleLit) return;

  const hand = results.landmarks[0];

  const isPointingUp =
    hand[8].y < hand[6].y &&
    hand[12].y > hand[10].y &&
    hand[16].y > hand[14].y &&
    hand[20].y > hand[18].y;

  if (isPointingUp) lightCandle();
}

function detectBlow(results) {
  if (!results.faceLandmarks.length || !candleLit) return;

  const mouthOpen =
    Math.abs(results.faceLandmarks[0][13].y -
             results.faceLandmarks[0][14].y) > 0.05;

  if (mouthOpen) blowOut();
}

function lightCandle() {
  cakeImage.src = "lit.png"
  candleLit = true;
  music.play();
}

function blowOut() {
  //reset cake and candle state
  cakeImage.src = "unlit.png";
  candleLit = false;
  music.pause();

  //show smoke briefly
  smokeImage.classList.remove("hidden");
  setTimeout(() => smokeImage.classList.add("hidden"), 2000);

  // after 2s show envelope
  setTimeout(() => {
    envelope.classList.remove("hidden");
    setTimeout(() => envelope.classList.add("show"), 50);

  }, 2000);
}

// Clicking the envelope also opens the message
envelope.addEventListener("click", () => {
  openMessage();
});


function openMessage() {
  messagePopup.classList.remove("hidden");
  envelope.classList.remove("show");
}

closeMessageBtn.addEventListener("click", () => {
  messagePopup.classList.add("hidden");
});

window.closePopup = function() {
  popup.classList.add("hidden");
};

async function start() {
  await setupCamera();
  await loadModels();
  detect();
}

start();
