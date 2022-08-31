const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true, parameterLimit: 5000000 }))

app.use(bodyParser.json({ limit: "500mb" }))
// POST method route
app.post('/postImages', (req, res) => {
  var data = req.body;
  global.imagesData = data;
  console.log(data);
  res.send("Data recibida");
})

app.get('/getImages', (req, res) => {
  var data=global.imagesData;
  console.log(data);
  res.send(data);
})

//Api para experimentos
app.post('/postImages1', (req, res) => {
  var data = req.body;
  global.imagesData1 = data;
  console.log(data);
  res.send("Data recibida");
})
app.post('/postImages2', (req, res) => {
  var data = req.body;
  global.imagesData2 = data;
  console.log(data);
  res.send("Data recibida");
})
app.post('/postImages3', (req, res) => {
  var data = req.body;
  global.imagesData3 = data;
  console.log(data);
  res.send("Data recibida");
})
app.post('/postImages4', (req, res) => {
  var data = req.body;
  global.imagesData4 = data;
  console.log(data);
  res.send("Data recibida");
})
app.post('/postImages5', (req, res) => {
  var data = req.body;
  global.imagesData5 = data;
  console.log(data);
  res.send("Data recibida");
})
app.get('/getImages1', (req, res) => {
  var data=global.imagesData1;
  console.log(data);
  res.send(data);
})
app.get('/getImages2', (req, res) => {
  var data=global.imagesData2;
  console.log(data);
  res.send(data);
})
app.get('/getImages3', (req, res) => {
  var data=global.imagesData3;
  console.log(data);
  res.send(data);
})
app.get('/getImages4', (req, res) => {
  var data=global.imagesData4;
  console.log(data);
  res.send(data);
})
app.get('/getImages5', (req, res) => {
  var data=global.imagesData5;
  console.log(data);
  res.send(data);
})
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})