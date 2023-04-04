# ONNX Runtime Web Experiment

This project is an experiment to explore the limitations and possibilities of running ONNX Runtime in a browser. It contains two models: Resnet and Yolov4. Resnet can be executed in WebGL (if the computer has the ability to do it) and WASM, while Yolov4 can only be executed in WASM. Both can also be executed directly with the browser CPU.

Based in https://shreyansh26.github.io/post/2021-01-25_deep_learning_in_the_browser/
## Installation

1. To install Node.js, follow these steps:

   * Visit the official Node.js website at [https://nodejs.org](https://nodejs.org) and click on the "Download" button.
   * Choose the appropriate version for your operating system (Windows, macOS, or Linux) and click on the download button for the recommended version.
   * Once the download is complete, run the installer and follow the on-screen instructions to complete the installation.
   * After the installation is complete, open a terminal or command prompt and type `node -v` to check the version of Node.js installed. If the installation was successful, it should display the version number.

   Note: The minimum version required for this project is v18.15.0, so make sure to download and install a version that is equal to or greater than this.

2. Clone the repository and go to the ONNX folder
3. Run `npm install dependencies`
4. Download the models:
    * Yolov4: [https://github.com/onnx/models/blob/main/vision/object_detection_segmentation/yolov4/model/yolov4.onnx](https://github.com/onnx/models/blob/main/vision/object_detection_segmentation/yolov4/model/yolov4.onnx)
    * Resnet: [https://github.com/onnx/models/blob/main/vision/classification/resnet/model/resnet50-v1-7.onnx](https://github.com/onnx/models/blob/main/vision/classification/resnet/model/resnet50-v1-7.onnx)
5. Move the downloaded models to the public folder in the project (the same folder as the index.js file)

## Usage

1. To open the server, run `npm start` and go to `http://localhost:3000/`
2. In the web page, select the model, mode, and backend options.
3. Click on the load button before running anything.
4. An example of use is loading the default image, selecting single mode, any model, and the WASM backend. Then click on the run button to download the result. (Note: Resnet model is not completed and is only available for benchmarking purposes.)

## Conclusion

By running this experiment, we can explore the capabilities and limitations of ONNX Runtime Web in a browser environment. This project can be extended to include other models and backends to further explore the possibilities of ONNX Runtime Web.
