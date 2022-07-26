//const onnx = require("../node_modules/onnxruntime-web");
//import { InferenceSession } from "onnxruntime-node";
var start_time;
var elapsed_time;

//Funtion to download
function download(content, fileName, contentType) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
 }
 
 //Function to jsonfy output and download
 function onDownload(jsonData){
  download(JSON.stringify(jsonData), "output.json", "text/plain");
 }

// Create an ONNX inference session with WebGL backend.
// Can be 'cpu', 'wasm' or 'webgl
async function loadModel() {
  
  //Session options to load
  const sessionOptions = {
    executionProviders: ['wasm'],
    enableProfiling: true
  };
  session = await ort.InferenceSession.create("./yolov4.onnx",sessionOptions);
  await imgSet();
}

async function imgSet() {
    let imageData = await WebDNN.Image.getImageArray(document.getElementById("image_url").value, {dstW: imageSize, dstH: imageSize});
    WebDNN.Image.setImageArrayToCanvas(imageData, imageSize, imageSize, document.getElementById('input_image'));
    document.getElementById('run_button').disabled = false;
    // log('Image loaded to canvas');
}

async function runExample() {

  //This commented section is for another preprocess steps
    // var img = document.getElementById("image_url")
    
    const img = new Image();
    img.onload = function() {
      imgElement = document.getElementById("image_url");
      console.log(imgElement)
      img.width = this.width;
      img.height = this.height;
    }
    img.src = document.getElementById("image_url").value;
    //console.log(img.width + 'x' + img.height);
    
    // Load image.
    const imageLoader = new ImageLoader(imageSize, imageSize);
    const imageData = await imageLoader.getImageData(document.getElementById("image_url").value);
    
    // Preprocess the image data to match input dimension requirement, 1x416x416x3
    const width = imageSize;
    const height = imageSize;

    start_time = performance.now();
    const preprocessedData = preprocessYOLO(imageData.data, width, height, img);
    //console.log([1, width, height, 3])

    const inputTensor = new ort.Tensor('float32', preprocessedData,  [1, width, height, 3]);

    const input = new String(session.inputNames[0]);
    const output = new String(session.outputNames[0]);
    
    const feeds = {[input] : inputTensor};

    // Run model with Tensor inputs and get the result.
    const result = await session.run(feeds);
    
    //Download result to use a python post process
    onDownload(result);

    //Print performance time
    console.log("Tiempo")
    console.log(performance.now() - start_time)
    
  }

  /**
   * Preprocess raw image data to match YoloV4 requirement.
   */
  
  function preprocessYOLO(data, width, height, img) {

    //width and height = iw, ih

    //Obtaining real values of width and height
    const realHeight = img.height;
    const realWidth = img.width;

    //Scaling image
    const scale = Math.min(height/realHeight,width/realWidth);
    const newWidth = parseInt(realWidth * scale);
    const newHeight = parseInt(realHeight * scale);

    //Creating a mat to use cv
    let mat = cv.imread(img);

    //Resize
    let image_resized = new cv.Mat();
    let dsize = new cv.Size(newWidth, newHeight);
    cv.resize(mat, image_resized, dsize, 0, 0, cv.INTER_LINEAR);

    //Create array from images and processed data
    const imageResized = ndarray(new Float32Array(image_resized.data), [newHeight,newWidth, 4]);
    const imagePadded = ndarray(new Float32Array(width * height * 3), [height, width, 3]);
    
    //Asigns 128 to make an np.full
    ndarray.ops.assigns(imagePadded, 128.0);
    
    const dWidth = Math.floor((width-newWidth)/2);
    const dHeight = Math.floor((height-newHeight)/2);

  
    console.log("Test dims");
    console.log(imagePadded.hi(dHeight+newHeight, dWidth+newWidth ,0).lo(dHeight , dWidth, 0).shape + " - " + imageResized.hi(null, null ,2).lo(null , null, 2).shape);
    
    //What i thing is right but it doesnt work
    
    //ndarray.ops.assign(imagePadded.hi(dWidth+newWidth, dHeight+newHeight,null).lo(dWidth, dHeight,null), imageResized);
    
    // //Aling test 1
    
    // ndarray.ops.assign(imagePadded.hi(0, dHeight+newHeight, dWidth+newWidth ,0).lo(0, dHeight , dWidth, 0), imageResized.hi(null, null, null ,2).lo(null, null , null, 2));
    // ndarray.ops.assign(imagePadded.hi(0, dHeight+newHeight, dWidth+newWidth ,1).lo(0, dHeight , dWidth, 1), imageResized.hi(null, null, null ,1).lo(null, null , null, 1));
    // ndarray.ops.assign(imagePadded.hi(0, dHeight+newHeight, dWidth+newWidth ,2).lo(0, dHeight , dWidth, 2), imageResized.hi(null, null, null ,0).lo(null, null , null, 0));
    
    //Aling test 2
    
    ndarray.ops.assign(imagePadded.hi(dHeight+newHeight, dWidth+newWidth ,0).lo(dHeight , dWidth, 0), imageResized.hi(null, null ,2).lo(null , null, 2));
    ndarray.ops.assign(imagePadded.hi(dHeight+newHeight, dWidth+newWidth ,1).lo(dHeight , dWidth, 1), imageResized.hi(null, null ,1).lo(null , null, 1));
    ndarray.ops.assign(imagePadded.hi(dHeight+newHeight, dWidth+newWidth ,2).lo(dHeight , dWidth, 2), imageResized.hi(null, null ,0).lo(null , null, 0));
    

    ndarray.ops.divseq(imagePadded, 255.0);
    return imagePadded.data;
  }
 