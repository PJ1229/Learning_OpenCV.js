// Copyright 2023 The MediaPipe Authors.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Import the required package.
import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@latest";

// Create required variables.
let gestureRecognizer = null;
let runningMode = "IMAGE";
let webcamRunning = false;

const videoHeight = "360px";
const videoWidth = "480px";

// Initialize the object detector.
async function initializeGestureRecognizer() {
  const visionFilesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  gestureRecognizer = await GestureRecognizer.createFromOptions(
    visionFilesetResolver,
    {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task",
      },
      scoreThreshold: 0.3,
    }
  );

  console.log("Gesture Recognizer initialized.");
}

// Call the initialize function
initializeGestureRecognizer();

const imageContainers = document.getElementsByClassName("detectOnClick");

for (let imageContainer of imageContainers) {
  imageContainer.children[0].addEventListener("click", handleClick);
}

/**
 * Detect objects in still images on click
 */
async function handleClick(event) {
  const highlighters =
    event.target.parentNode.getElementsByClassName("highlighter");
  while (highlighters[0]) {
    highlighters[0].parentNode.removeChild(highlighters[0]);
  }

  const infos = event.target.parentNode.getElementsByClassName("info");
  while (infos[0]) {
    infos[0].parentNode.removeChild(infos[0]);
  }

  // Verify object detector is initialized and choose the correct running mode.
  if (!gestureRecognizer) {
    console.log("Wait! gestureRecognizer not loaded yet.");
    return;
  }
  if (runningMode === "VIDEO") {
    runningMode = "IMAGE";
    await gestureRecognizer.setOptions({ runningMode: runningMode });
  }

  // Run object detection.
  const detections = await gestureRecognizer.recognize(event.target);
  // Call the displayImageDetections() function.
  displayImageDetections(event, detections);
}

function displayImageDetections(event, results) {
  // Display object detection results.
  if (results.gestures.length > 0) {
    const p = event.target.parentNode.childNodes[3];
    p.setAttribute("class", "info");

    const categoryName = results.gestures[0][0].categoryName;
    const categoryScore = parseFloat(
      results.gestures[0][0].score * 100
    ).toFixed(2);
    const handedness = results.handednesses[0][0].displayName;

    p.innerText = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore}%\n Handedness: ${handedness}`;
    p.style =
      "left: 0px;" +
      "top: " +
      event.target.height +
      "px; " +
      "width: " +
      (event.target.width - 10) +
      "px;";

    const canvas = document.createElement("canvas");
    canvas.setAttribute("class", "canvas");
    canvas.setAttribute("width", event.target.naturalWidth + "px");
    canvas.setAttribute("height", event.target.naturalHeight + "px");
    canvas.style =
      "left: 0px;" +
      "top: 0px;" +
      "width: " +
      event.target.width +
      "px;" +
      "height: " +
      event.target.height +
      "px;";

    event.target.parentNode.appendChild(canvas);
    const canvasCtx = canvas.getContext("2d");
    const drawingUtils = new DrawingUtils(canvasCtx);
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 5,
        }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 1,
      });
    }
  }
}

/********************************************************************
 *   Continuously grab image from webcam stream and detect it
 ********************************************************************/

let video = document.getElementById("webcam");
const liveView = document.getElementById("liveView");
let canvasElement = document.getElementById("output_canvas");
let canvasCtx = canvasElement.getContext("2d");
let gestureOutput = document.getElementById("gesture_output");
let enableWebcamButton;
// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Keep a reference of all the child elements we create
// so we can remove them easilly on each render.
let children = [];

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start detection.
async function enableCam(event) {
  if (!gestureRecognizer) {
    console.log("Wait! gestureRecognizer not loaded yet.");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "Enable Webcam";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "Disable Webcam";
  }
  // Store getUsermedia parameters.
  const constraints = {
    video: true,
  };

  // Activate the webcam stream.
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      video.srcObject = stream;
      video.addEventListener("loadeddata", predictWebcam);
    })
    .catch((err) => {
      console.error(err);
      /* handle the error */
    });
}

let lastVideoTime = -1;
let results = undefined;
const webcamElement = document.getElementById("webcam");
async function predictWebcam() {
  // Run video object detection.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await gestureRecognizer.setOptions({ runningMode: runningMode });
  }
  let nowInMs = Date.now();
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    results = gestureRecognizer.recognizeForVideo(video, nowInMs);
  }

  displayVideoDetections(results);
  // Call this function again to keep predicting when the browser is ready
  window.requestAnimationFrame(predictWebcam);
}

function displayVideoDetections(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  const drawingUtils = new DrawingUtils(canvasCtx);

  canvasElement.style.height = videoHeight;
  webcamElement.style.height = videoHeight;
  canvasElement.style.width = videoWidth;
  webcamElement.style.width = videoWidth;

  // Check if results.landmarks is defined
  if (results) {
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 5,
        }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 2,
      });
    }

    canvasCtx.restore();
    if (results.gestures.length > 0) {
      gestureOutput.style.display = "block";
      gestureOutput.style.width = videoWidth;
      const categoryName = results.gestures[0][0].categoryName;
      const categoryScore = parseFloat(
        results.gestures[0][0].score * 100
      ).toFixed(2);
      const handedness = results.handednesses[0][0].displayName;
      gestureOutput.innerText = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore} %\n Handedness: ${handedness}`;
    } else {
      gestureOutput.style.display = "none";
    }
  }
}
