#!/bin/sh

if [ "$1" = "showmapped" ]; then
    echo '[{"id": "0","pool": "replicapool","namespace": "","name": "monitoring_prometheus-data","snap": "-","device": "/dev/rbd0"}]'
fi

if [ "$1" = "map" ]; then
    echo '/dev/rbd1'
fi

exit 0