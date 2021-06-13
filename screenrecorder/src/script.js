const { desktopCapturer, remote } = require("electron");

const { writeFile } = require("fs");

const { dialog, Menu } = remote;

const start = document.querySelector(".start");
const stop = document.querySelector(".stop");
const video = document.querySelector("video");
const select = document.querySelector(".select");
select.onclick = getScreens;
let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

start.onclick = (e) => {
  mediaRecorder.start();
  start.innerText = "Recording";
};

stop.onclick = (e) => {
  mediaRecorder.stop();
  stop.innerText = "Start";
};
async function getScreens() {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screens"],
  });

  const screenMenu = Menu.buildFromTemplate(
    inputSources.map((source) => {
      return {
        label: source.name,
        click: () => {
          selectSource(source);
        },
      };
    })
  );
  screenMenu.popup();
}

async function selectSource(source) {
  select.innerText = source.name;
  const contraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
      },
    },
  };
  const stream = await navigator.mediaDevices.getUserMedia(contraints);
  video.srcObject = stream;
  video.play();

  const options = { mimeType: "video/webm; codecs=vp9" };
  mediaRecorder = new MediaRecorder(stream, options);

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e) {
  console.log("video data available");
  recordedChunks.push(e.data);
}
// Saves the video file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: "video/webm; codecs=vp9",
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `vid-${Date.now()}.webm`,
  });

  if (filePath) {
    writeFile(filePath, buffer, () => console.log("video saved successfully!"));
  }
}
