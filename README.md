# docker-volume-rbd

Docker volume plugin for ceph rbd.

This plugin uses the official ceph/ceph image with a simple node script as docker volume plugin api endpoint. The node script uses the standard ceph commandline tools to perform the rbd create, map, unmap, remove and mount operations. This release aligns with the Ceph Octopus release (v15.2).

For normal use, setup the /etc/ceph folder on the host and install with:

```
% docker plugin install md6fr/rbd:v15.2-v1.1.1 RBD_CONF_POOL="rbd"
```

where RBD_CONF_POOL is optional and defaults to "rbd".

Build with or use the build.sh build script (_do not do this on a production system!_):

```
% docker build . -t md6fr/rbd:v15.2-v1.1.1

% id=$(docker create md6fr/rbd:v15.2-v1.1.1 true)
% mkdir rootfs
% docker export "$id" | sudo tar -x -C rootfs
% docker rm -vf "$id"
% docker rmi md6fr/rbd:v15.2-v1.1.1

% docker plugin create md6fr/rbd:v15.2-v1.1.1 .
% rm -rf rootfs

% docker plugin enable md6fr/rbd:v15.2-v1.1.1
```

Example of how to create a volume:

```
% docker volume create -d md6fr/rbd:v15.2-v1.1.1 -o size=150M test2
```

size is optional and default to 200M.

In my development setup (hyper-v virtualized ceph and docker nodes), the xfs filesystem gives me better write performance over ext4, read performance is about the same.

**WARNING**: do _NOT_ mount a volume on multiple hosts at the same time to prevent filesystem corruption! If you need to share a filesysem between hosts use CephFS or Cifs.

## Changelog

### v1.1.1
- fix rbd disk creation by enabling by default exclusive-locking feature

### v1.1.0
- remove option to set fstype : ext4 not recommended
- add comments to support bigtime=1 on xfs in the future
- change readme to account to new name
- add noatime and nodiratime to mount options by default
- increase mount and umount timeouts
- add lock check to avoid mapped rbd images on multiple hosts
- improve build.sh
- add barebone test env

### v1.0.0
- Fork of robkaandorp/docker-volume-rbd
- add ismapped to map function to make it mandatory
- Throw error when rbd showmapped exits badly