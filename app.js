let express = require('express');
const _ = require('lodash');
const path = require('path');
const { getDestEnv, getServiceEnv } = require("./lib/utils/vcap-utils")
const bootstrap = require('./lib/bootstrap')
const xsservices = require('./lib/xsenv/lib/xsservices')
const cfservices = require('./lib/xsenv/lib/cfservice')
const servicebindingservices = require('./lib/xsenv/lib/serviceBindingService')
const k8sservices = require('./lib/xsenv/lib/k8sservice')
const cacert = require('./lib/xsenv/lib/cacert')
const loadEnv = require('./lib/xsenv/lib/loadEnv')

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
      "/env/xsservices/loadenv",
      "/env/xsservices/readservices",
      "/env/xsservices/loaddefaultservices",
      "/env/xsservices/getservices/object",
      "/env/xsservices/getservices/function",
      "/env/cfservice/readcfservices",
      "/env/servicebindingservice/readservicebindingservices",
      "/env/servicebindingservice/readfiles",
      "/env/servicebindingservice/parseproperties",
      "/env/k8sservice/readk8sservices",
      "/env/cacert/loadcertificates",
      "/env/filter/apply"
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

app.get('/env/xsservices/loadenv', function (req, res) {
  loadEnv(path.join(process.cwd(), 'default-env.json'));
  res.send(JSON.parse(process.env.VCAP_SERVICES));
});

app.get('/env/xsservices/loaddefaultservices', function (req, res) {
  let defaultServices = xsservices.loadDefaultServices(path.join(process.cwd(), 'default-services.json'));
  res.send(defaultServices);
});

app.get('/env/xsservices/getservices/object', function (req, res) {
  let filterservicesbyobject = xsservices.getServices({ "name" : "my-xsuaa-1"} ).name;
  res.send(filterservicesbyobject);
});

app.get('/env/xsservices/getservices/function', function (req, res) {
  let filterservicesbyfunc = xsservices.getServices({ uaa : matchesUaa } ).uaa;
  res.send(filterservicesbyfunc);
});

app.get('/env/cfservice/readcfservices', function (req, res) {
  let cloudfoundryservices = cfservices.readCFServices();
  res.send(cloudfoundryservices);
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

app.get('/env/xsservices/readservices', function (req, res) {
  let services = xsservices.readServices();
  res.send(services);
})

app.get('/env/cacert/loadcertificates', function (req, res) {
  dirList = "C:\\Users\\vravipati\\Downloads\\certdicectory1\\signavio.crt;C:\\Users\\vravipati\\Downloads\\certdicectory2\\hds.crt";
  let certs = cacert.loadCertificates(dirList)
  res.send(certs);
})


// Helper methods

function matchesUaa(service) {
  if (_.includes(service.tags, 'xsuaa')) {
    return true;
  }
  return false;
}



app.listen(3000, function () {
  routerConfig = bootstrap(options);
  console.log('Example app listening on port 3000!');
});


function fibo(n) { // 1
  if (n < 2)
    return 1;
  else   return fibo(n - 3) + fibo(n - 1);
}