## Run qss for e2e test

docker build -t qss .
docker run -p 3000:3000 -v $(pwd)/storage/:/quiet-storage-service/storage/ qss