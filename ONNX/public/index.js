//Functions to use
function updateModel() {
  const modelSelect = document.getElementById("model_select");
  const modelName = modelSelect.options[modelSelect.selectedIndex].value;
  console.log(`Selected model: ${modelName}`);
  // Code to update the model
}

function updateMode() {
  const modeSelect = document.getElementById("mode_select");
  const modeName = modeSelect.options[modeSelect.selectedIndex].value;
  console.log(`Selected mode: ${modeName}`);
  // Code to update the mode
}

function updateBackend() {
  const backendSelect = document.getElementById("backend_select");
  const dimensionValue =
    backendSelect.options[backendSelect.selectedIndex].value;
  console.log(`Selected backend: ${dimensionValue}`);
}

async function imgSet() {
  let imageData = await WebDNN.Image.getImageArray(
    document.getElementById("image_url").value,
    { dstW: imageSize, dstH: imageSize }
  );
  WebDNN.Image.setImageArrayToCanvas(
    imageData,
    imageSize,
    imageSize,
    document.getElementById("input_image")
  );
  document.getElementById("run_button").disabled = false;
  // log('Image loaded to canvas');
}

//Exececute the program
async function runExample() {
  //Getting options selected

  //Model to be charge
  const modelSelect = document.getElementById("model_select");
  const modelName = modelSelect.options[modelSelect.selectedIndex].value;

  let imageSize = 416;
  let arrayExpected = [1, imageSize, imageSize, 3];

  if (modelName == "resnet") {
    imageSize = 224;
    arrayExpected = [1, 3, imageSize, imageSize];
  }

  //Mode of execution
  const modeSelect = document.getElementById("mode_select");
  const modeName = modeSelect.options[modeSelect.selectedIndex].value;

  //Backend election
  const backendSelect = document.getElementById("backend_select");
  const backendValue = backendSelect.options[backendSelect.selectedIndex].value;

  console.log("Loading...");
  await loadModel(modelName, backendValue);

  console.log("Entering mode: ", modeName);
  switch (modeName) {
    case "batch":
      console.log("Running batch mode");
      runBatchModel(
        imageSize,
        arrayExpected,
        "http://localhost:3000/getImages4",
        "output.json",
        modelName
      );
      break;
    case "experimentation":
      console.log("Running experimentation mode");
      runBenchmark(imageSize, arrayExpected, 5, modelName, backendValue);
      break;
    default:
      console.log("Running single mode");
      runSingleModel(imageSize, arrayExpected, modelName);
  }
}

// Create an ONNX inference session with WebGL backend.
// Can be 'cpu', 'wasm' or 'webgl
async function loadModel(modelName, backendValue) {
  //Session options to load
  const sessionOptions = {
    executionProviders: [backendValue],
    enableProfiling: true
  };

  if (modelName == "resnet") {
    session = await ort.InferenceSession.create(
      "./resnet50-v1-7.onnx",
      sessionOptions
    );
  } else {
    session = await ort.InferenceSession.create(
      "./yolov4.onnx",
      sessionOptions
    );
  }
  // get the current session configuration settings
  //console.log(sessionOptions);
  //console.log(session);
  await imgSet();
  console.log("Model Loaded");
}
