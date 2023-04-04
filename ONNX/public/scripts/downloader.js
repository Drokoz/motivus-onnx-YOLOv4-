//Funtion to download
function download(content, fileName, contentType) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

//Function to jsonfy output and download
function onDownload(jsonData, fileName) {
  download(JSON.stringify(jsonData), fileName, "text/plain");
}
