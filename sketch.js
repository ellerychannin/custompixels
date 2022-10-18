let faceapi;
let bodypix;
let segmentation;
let detections = [];

let video;
let canvas;

const emotionLabels = ["neutral", "happy", "angry", "sad", "disgusted", "surprised", "fearful"];

// change emoji based on emotions detected

const bodyOptions = {
  outputStride: 32, // 8, 16, or 32, default is 16
  segmentationThreshold: 0.3, // 0 - 1, defaults to 0.5 
}

const faceOptions = {
  withLandmarks: true,
  withExpressions: true,
  withDescriptors: false,
  minConfidence: 0.5
}

let emotionDetected;
let imgHappy;
let imgNeutral;
function preload() {
  // preload() runs once
  imgNeutral = loadImage('assets/neutral_black.png');
  imgHappy = loadImage('assets/happy_black.png');
  imgSurprised = loadImage('assets/surprised_black.png');
  imgAngry = loadImage('assets/angry_black.png');
  imgSad = loadImage('assets/sad_black.png');

}



function setup() {
  canvas = createCanvas(120, 90);
  canvas.id('canvas');
  video = createCapture(VIDEO);
  video.size(width, height);
  video.id('video');
  // createHSBPalette();

  bodypix = ml5.bodyPix(video, modelReady);

  faceapi = ml5.faceApi(video, faceOptions, faceReady);
  // bodypix.segmentWithParts(video, bodyReady, bodyOptions);

}

function modelReady() {
  console.log('model ready');
  bodypix.segment(bodyReady, bodyOptions);
  // bodypix.segmentWithParts(bodyReady, bodyOptions);

}

function videoReady() {
  // bodypix.segmentWithParts(bodyReady, bodyOptions);
  bodypix.segment(bodyReady, bodyOptions);
}

function bodyReady(error, result) {
  if (error) {
      console.log(error);
      return;
  }
  segmentation = result;
  console.log(segmentation);

  background(0);
  image(video, 0, 0, width, height);
  console.log(segmentation);
  image(segmentation.maskBackground, 0, 0, width, height);
  drawEmojis();
  // console.log(segmentation.backgroundMask);
  bodypix.segment(bodyReady, bodyOptions);

  // bodypix.segmentWithParts(bodyReady, bodyOptions);

}

function faceReady() {
  faceapi.detect(processFace);

}

function processFace(error, result) {
  if(error) {
    console.log(error);
    return;
  }

  detections = result;
  // clear();
  // drawLandmarks(detections);
  detectEmotions(detections);

  // console.log(detections);
  faceapi.detect(processFace);


}

function draw() {
  // background(220);

}

function drawEmojis() {
      // https://p5js.org/reference/#/p5.Image/loadPixels
      // canvas.loadPixels();
      
      let pixelSize = 10;
      for (let captureY = 0; captureY < canvas.height; captureY += pixelSize) {
        for (let captureX = 0; captureX < canvas.width; captureX += pixelSize) {
          // https://p5js.org/reference/#/p5/pixels
          let offset = (captureY * canvas.width + captureX) * 4;
          let xpos = (captureX / canvas.width) * width;
          let ypos = (captureY / canvas.height) * height;
          let color = get(xpos, ypos);
          // let colorR = segmentation.raw.date[offset];
          
          // console.log(color);

          if (color[0] == 0 && color[1] == 0 && color[2] == 0) {
            image(imgNeutral, xpos, ypos,  pixelSize, pixelSize);
          } else {
            console.log(emotionDetected);
            switch(emotionDetected) {
              case "happy":
                image(imgHappy, xpos, ypos,  pixelSize, pixelSize);
                break;
              case "neutral":
                image(imgNeutral, xpos, ypos,  pixelSize, pixelSize);
                break;
              case "surprised":
                image(imgSurprised, xpos, ypos,  pixelSize, pixelSize);
                break;
              case "angry":
                image(imgAngry, xpos, ypos,  pixelSize, pixelSize);
                break;
              case "sad":
                image(imgSad, xpos, ypos,  pixelSize, pixelSize);
                break;
              default:
                image(imgNeutral, xpos, ypos,  pixelSize, pixelSize);
                break;
            }
          } 
  
        }
      }
}


function createHSBPalette() {
  colorMode(HSB);
  bodyOptions.palette = bodypix.config.palette;
  Object.keys(bodyOptions.palette).forEach(part => {
    const h = floor(random(360));
    const s = floor(random(100));
    const b = floor(random(100));
    const c = color(h, s, b);
    bodyOptions.palette[part].color = c;
  });
}

function detectEmotions(detections) {
  if (detections.length > 0) {
    for (let f = 0; f < detections.length; f++) {
      // console.log(detections[f]);
      let {neutral, happy, angry, sad, disgusted, surprised, fearful}
      = detections[f].expressions;

      let emotionScores = detections[f].expressions;

      emotionDetected = Object.keys(emotionScores).reduce(function(a, b){ return emotionScores[a] > emotionScores[b] ? a : b });
      // console.log(emotionDetected);
      
      // console.log(emotionLabels[emotionScores.indexOf(Math.max(emotionScores))]);

    
      // console.log("neutral:" + neutral);
      // console.log("happy:" + happy);
      // console.log("angry:" + angry);
      // console.log("sad:" + sad);
      // console.log("disgusted:" + disgusted);
      // console.log("surprised:" + surprised);
      // console.log("fearful:" + fearful);

    }
  }
}


function drawLandmarks(detections) {
  if (detections.length > 0) {
    for (let f = 0; f < detections.length; f++) {
      let landmarks = detections[f].landmarks;
      let jawOutline = landmarks.getJawOutline();
      let nose = landmarks.getNose();
      let mouth = landmarks.getMouth();
      let leftEye = landmarks.getLeftEye();
      let rightEye = landmarks.getRightEye();
      let leftEyeBbrow = landmarks.getLeftEyeBrow();
      let rightEyeBrow = landmarks.getRightEyeBrow();
      drawFacialFeatures(jawOutline, true);
      drawFacialFeatures(nose, true);
      drawFacialFeatures(mouth);
      drawLeftCheek(leftEye[0], nose[1], jawOutline[5]);
      // drawRightEyes(rightEye);
      drawFacialFeatures(leftEyeBbrow);
      drawFacialFeatures(rightEyeBrow);
    }
  }
}


function drawFacialFeatures(points, isJawOrNose = false) {

  for (let i=0; i<points.length-1; i++){
    stroke(0);
    strokeWeight(3);
    // point(points[i]._x, points[i]._y);
    line(points[i]._x, points[i]._y, points[i+1]._x, points[i+1]._y);
  }
  if (!isJawOrNose) {
    line(points[0]._x,points[0]._y, points[points.length-1]._x,  points[points.length-1]._y);
  }
}

function drawLeftCheek(eyePoint, nosePoint, jawOutlinePoint) {
  stroke(0);
  strokeWeight(3);
  point(jawOutlinePoint._x, jawOutlinePoint._y);
  line(eyePoint._x, eyePoint._y+15, nosePoint._x-12, nosePoint._y);
  line(jawOutlinePoint._x+10, jawOutlinePoint._y-10, eyePoint._x-5, eyePoint._y+15);

}


//https://www.youtube.com/watch?v=jKHgVdyC55M
//https://www.youtube.com/watch?v=3yqANLRWGLo