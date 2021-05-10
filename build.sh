#!/bin/bash

MD6_VERSION=v1.1.1
CEPH_VERSION=v15.2

docker plugin disable "md6fr/rbd:$CEPH_VERSION-$MD6_VERSION" -f
docker plugin rm "md6fr/rbd:$CEPH_VERSION-$MD6_VERSION" -f
rm -rf plugin

git pull
docker build . -t "md6fr/rbd:$CEPH_VERSION-$MD6_VERSION"

id=$(docker create "md6fr/rbd:$CEPH_VERSION-$MD6_VERSION" true)
mkdir -p plugin/rootfs
cp config.json plugin/
docker export "$id" | sudo tar -x -C plugin/rootfs
docker rm -vf "$id"
docker rmi "md6fr/rbd:$CEPH_VERSION-$MD6_VERSION"

docker plugin create "md6fr/rbd:$CEPH_VERSION-$MD6_VERSION" plugin/
docker plugin push "md6fr/rbd:$CEPH_VERSION-$MD6_VERSION"
