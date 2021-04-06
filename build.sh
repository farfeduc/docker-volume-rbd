#!/bin/bash

docker plugin disable md6fr/rbd:v15.2-v1.0.0 -f
docker plugin rm md6fr/rbd:v15.2-v1.0.0 -f
rm -rf plugin

git pull
docker build . -t md6fr/rbd:v15.2-v1.0.0

id=$(docker create md6fr/rbd:v15.2-v1.0.0 true)
mkdir -p plugin/rootfs
cp config.json plugin/
docker export "$id" | sudo tar -x -C plugin/rootfs
docker rm -vf "$id"
docker rmi md6fr/rbd:v15.2-v1.0.0

docker plugin create md6fr/rbd:v15.2-v1.0.0 plugin/
docker plugin enable md6fr/rbd:v15.2-v1.0.0
docker plugin ls
