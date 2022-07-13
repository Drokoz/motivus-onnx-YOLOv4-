//const onnx = require("../node_modules/onnxruntime-web");
//import { InferenceSession } from "onnxruntime-node";
var start_time;
var elapsed_time;
function download(content, fileName, contentType) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
 }
 
 function onDownload(jsonData){
  download(JSON.stringify(jsonData), "output.json", "text/plain");
 }
function log(msg) {
  let msg_node = document.getElementById('messages');
  msg_node.appendChild(document.createElement('br'));
  msg_node.appendChild(document.createTextNode(msg));
}

async function loadModel() {
  // Create an ONNX inference session with WebGL backend.
  // Can be 'cpu' or 'wasm'
  //session = new onnx.InferenceSession({ backendHint: 'webgl' });
  
  const sessionOptions = {
    executionProviders: ['wasm'],
    enableProfiling: true
  };
  session = await ort.InferenceSession.create("./yolov4.onnx",sessionOptions);

  console.log("model loaded!")
  console.log(session)
  await imgSet();
}

async function imgSet() {
    let imageData = await WebDNN.Image.getImageArray(document.getElementById("image_url").value, {dstW: imageSize, dstH: imageSize});
    WebDNN.Image.setImageArrayToCanvas(imageData, imageSize, imageSize, document.getElementById('input_image'));
    document.getElementById('run_button').disabled = false;
    // log('Image loaded to canvas');
}

async function runExample() {
    // Load image.
    var img = document.getElementById("image_url")
    
    const imgs = new Image();
    imgs.onload = function() {
      console.log(this.width + 'x' + this.height);
      imgs.width = this.width;
      imgs.height = this.height;
      //let mat = cv.imread(imgElement);
    }
    imgs.src = img.value;
    console.log(imgs.width)
    const imageLoader = new ImageLoader(imgs.width,imgs.height);
    const imageData = await imageLoader.getImageData(document.getElementById("image_url").value);
   
    console.log(imageData)
    // Preprocess the image data to match input dimension requirement, which is 1*3*224*224.
    const width = imageSize;
    const height = imageSize;

    start_time = performance.now();
    const preprocessedData = preProcess(imageData, width, height, imgs.height, imgs.width);
    //console.log([1, width, height, 3])

    const inputTensor = new ort.Tensor('float32', preprocessedData,  [1, width, height, 3]);

    const input = new String(session.inputNames[0]);
    const output = new String(session.outputNames[0]);
    //const data = Float32Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    //const data_tensor = new ort.Tensor('float32', data, [3, 4]);
    const feeds = {[input] : inputTensor};

    // Run model with Tensor inputs and get the result.
    const result = await session.run(feeds);
    //const outputData = outputMap.values().next().value.data;
    console.log(result)
    console.log(result[output])
    //onDownload(result)
    let json = JSON.stringify(result);
    console.log(json)
    //const outputData = result[output].data
    // Render the output result in html.
    //printMatches(outputData);
  }

  /**
   * Preprocess raw image data to match Resnet50 requirement.
   */
  function preProcess(image, width, height, real_height, real_width) {
    const data = image.data
    const scale = Math.min(width/real_width, height/real_height);
    log(scale);
    const new_witdth = Math.floor(scale*real_width);
    const new_height = Math.floor(scale*real_height);
    console.log(new_witdth,new_height)
    console.log(image);
    //const image_resized = ndarray(new Float32Array(data), [new_witdth, new_height, 4]);
    //Creating output
    const dataFromImage = ndarray(new Float32Array(data), [width, height, 4]);
    const dataProcessed = ndarray(new Float32Array(width * height * 3), [1, height, width, 3]);

    ndarray.ops.assigns(dataProcessed, 128.0)
    //ndarray.ops.divseq(dataFromImage, 128.0);
    
    //Resize
    ndarray.ops.assign(dataProcessed.pick(0, null, null, 0), dataFromImage.pick(null, null, 2));
    ndarray.ops.assign(dataProcessed.pick(0, null, null, 1), dataFromImage.pick(null, null, 1));
    ndarray.ops.assign(dataProcessed.pick(0, null, null, 2), dataFromImage.pick(null, null, 0));

    ndarray.ops.divseq(dataProcessed, 255.0);
    return dataProcessed.data;
  }
  /**
   * Utility function to post-process Resnet50 output. Find top k ImageNet classes with highest probability.
   */
  function imagenetClassesTopK(classProbabilities, k) {
    if (!k) { k = 5; }
    const probs = Array.from(classProbabilities);
    const probsIndices = probs.map(
      function (prob, index) {
        return [prob, index];
      }
    );
    const sorted = probsIndices.sort(
      function (a, b) {
        if (a[0] < b[0]) {
          return -1;
        }
        if (a[0] > b[0]) {
          return 1;
        }
        return 0;
      }
    ).reverse();
    const topK = sorted.slice(0, k).map(function (probIndex) {
      const iClass = imagenetClasses[probIndex[1]];
      return {
        id: iClass[0],
        index: parseInt(probIndex[1], 10),
        name: iClass[1].replace(/_/g, ' '),
        probability: probIndex[0]
      };
    });
    return topK;
  }

  /**
   * Render Resnet50 output to Html.
   */
  function printMatches(data) {
    let outputClasses = [];
    if (!data || data.length === 0) {
      const empty = [];
      for (let i = 0; i < 5; i++) {
        empty.push({ name: '-', probability: 0, index: 0 });
      }
      outputClasses = empty;
    } else {
      outputClasses = imagenetClassesTopK(data, 5);
    }
    const predictions = document.getElementById('predictions');
    predictions.innerHTML = '';
    const results = [];
    for (let i of [0, 1, 2, 3, 4]) {
      results.push(`${outputClasses[i].name}: ${Math.round(100 * outputClasses[i].probability)}%`);
    }
    elapsed_time = performance.now() - start_time;
    results.push(`Time taken: ${elapsed_time.toFixed(2)}ms`);
    predictions.innerHTML = results.join('<br/>');
  }
