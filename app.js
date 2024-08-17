let express = require('express');
const path = require('path');
const { getDestEnv, getServiceEnv } = require("./lib/utils/vcap-utils")
const bootstrap = require('./lib/bootstrap')
const xsservices = require('./lib/xsenv/lib/xsservices')
const servicebindingservices = require('./lib/xsenv/lib/serviceBindingService')
const k8sservices = require('./lib/xsenv/lib/k8sservice')

let app = express();

let options = {};
let routerConfig = {};

app.get('/', function (req, res) {
  let obj = {
    endpoints: [
      "/ping",
      "/current-date",
      "/fibo/:n",
      "/utils/vcaputils/getdestenv",
      "/utils/vcaputils/getserviceenv",
      "/getrouterconfig",
      "/env/xsservices/loaddefaultservices",
      "/env/xsservices/filterservices",
      "/env/servicebindingservice/readservicebindingservices",
      "/env/servicebindingservice/readfiles",
      "/env/servicebindingservice/parseproperties",
      "/env/k8sservice/readk8sservices"
    ]
  };
  res.send(obj);
});

app.get('/ping', function (req, res) {
  res.send("pong");
});


app.get('/current-date', function (req, res) {
  let obj = {
    name: "current",
    value: new Date()
  };
  res.send(obj);
});

app.get('/fibo/:n', function (req, res) {
  let obj = {
    name: "fibo",
    value: fibo(req.params.n)
  };
  res.send(obj);
});

app.get('/utils/vcaputils/getdestenv', function (req, res) {
  let obj = getDestEnv();
  res.send(obj);
});

app.get('/utils/vcaputils/getserviceenv', function (req, res) {
  let obj = getServiceEnv();
  res.send(obj);
});

app.get('/getrouterconfig', function (req, res) {
  res.send(routerConfig);
});

app.get('/env/xsservices/loaddefaultservices', function (req, res) {
  let defaultServices = xsservices.loadDefaultServices(path.join(process.cwd(), 'default-services.json'));
  res.send(defaultServices);
});

app.get('/env/xsservices/filterservices', function (req, res) {
  let defaultServices = xsservices.filterServices({ "name" : "my-xsuaa" } );
  res.send(defaultServices);
});

app.get('/env/servicebindingservice/readservicebindingservices', function (req, res) {
  let bindings = servicebindingservices.readServiceBindingServices();
  res.send(bindings);
});

app.get('/env/servicebindingservice/readfiles', function (req, res) {
  let directoryData = servicebindingservices.readFiles(path.join(process.cwd(), "\\bindings\\xsuaa"));
  res.send(directoryData);
});


app.get('/env/servicebindingservice/parseproperties', function (req, res) {
  let directoryData = servicebindingservices.readFiles(path.join(process.cwd(), "\\bindings\\xsuaa"));
  let bindingData = servicebindingservices.parseProperties(directoryData, JSON.parse(directoryData[".metadata"]).metaDataProperties);
  bindingData.credentials = servicebindingservices.parseProperties(directoryData, JSON.parse(directoryData[".metadata"]).credentialProperties);
  res.send(bindingData);
});

app.get('/env/servicebindingservice/readk8sservices', function (req, res) {
  let kymaservices = k8sservices.readK8SServices();
  res.send(kymaservices);
})

app.listen(3000, function () {
  routerConfig = bootstrap(options);
  console.log('Example app listening on port 3000!');
});


function fibo(n) { // 1
  if (n < 2)
    return 1;
  else   return fibo(n - 3) + fibo(n - 1);
}