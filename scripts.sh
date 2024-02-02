docker build -t ravipativenu/kyma-helloworld-nodejs:latest .
docker run -d -p 3000:3000 ravipativenu/kyma-helloworld-nodejs:latest
docker push ravipativenu/kyma-helloworld-nodejs:latest
kubectl apply -f .\kubernetes\deployment.yml
kubectl apply -f .\kubernetes\service-external.yml


