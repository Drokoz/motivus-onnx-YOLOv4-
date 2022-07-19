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
    
    // const imgs = new Image();
    // imgs.onload = function() {
    //   console.log(this.width + 'x' + this.height);
    //   imgs.width = this.width;
    //   imgs.height = this.height;
    //   //let mat = cv.imread(imgElement);
    // }
    // imgs.src = img.value;
    // console.log(imgs.width)


    // Load image.
    const imageLoader = new ImageLoader(imageSize, imageSize);
    const imageData = await imageLoader.getImageData(document.getElementById("image_url").value);
    
    // Preprocess the image data to match input dimension requirement, 1x416x416x3
    const width = imageSize;
    const height = imageSize;

    start_time = performance.now();
    const preprocessedData = preprocessYOLO(imageData.data, width, height);
    console.log([1, width, height, 3])

    const inputTensor = new ort.Tensor('float32', preprocessedData,  [1, width, height, 3]);

    const input = new String(session.inputNames[0]);
    const output = new String(session.outputNames[0]);
    
    const feeds = {[input] : inputTensor};

    // Run model with Tensor inputs and get the result.
    const result = await session.run(feeds);
    
    //Download result to use a python post process
    onDownload(result)

    //Print performance time
    console.log("Tiempo")
    console.log(performance.now() - start_time)
    
  }

  /**
   * Preprocess raw image data to match YoloV4 requirement.
   */
  
  function preprocessYOLO(data, width, height) {
    //Create array from images and processed data
    const dataFromImage = ndarray(new Float32Array(data), [width, height, 4]);
    const dataProcessed = ndarray(new Float32Array(width * height * 3), [1, height, width, 3]);

    //Asigns 128 to null values
    ndarray.ops.assigns(dataProcessed, 128.0)
    //ndarray.ops.divseq(dataFromImage, 128.0);
    
    //Resize
    ndarray.ops.assign(dataProcessed.pick(0, null, null, 0), dataFromImage.pick(null, null, 2));
    ndarray.ops.assign(dataProcessed.pick(0, null, null, 1), dataFromImage.pick(null, null, 1));
    ndarray.ops.assign(dataProcessed.pick(0, null, null, 2), dataFromImage.pick(null, null, 0));

    ndarray.ops.divseq(dataProcessed, 255.0);
    return dataProcessed.data;
  }
 