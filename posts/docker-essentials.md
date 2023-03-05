---
title: "Docker essential commands"
date: "2021-12-17"
---

# Table of Contents

# Introduction

[Running containers][1] is the absolute minimum a developer need to know about docker. Here are a few tips:

## Run MySQL and expose it on Port 3306

Instead of installing a MySQL in your localhost for development purposes, just use Docker to simplify your life:

```bash
docker run -p 3306:3306
  --name mysql-sandbox
  --env MYSQL_ROOT_PASSWORD=123456
  --detach mysql:8.0
```

If you want to connect to it from another container, you can do so by referencing it's Docker internal IP address:

```bash
docker run -it
  --rm mysql:8.0
  mysql -h172.17.0.3 -uroot -p123456
```

By default all containers are created inside the default [Docker Bridge-Network][2] and are assigned IPs on that network.

> - To find the instance internal IP you can [inspect][3] the instance
> - If you prefer referencing containers by name you can use [docker-compose][6].

If you just want to log into your running container, use the [exec][4] command referencing it's name:

```sh
 docker exec -it mysql-sandbox bash
```

## Run a temporary mysql instance

While containers can create, update, and delete files, those changes are lost when the container is removed and all changes are isolated to that container.  [Volumes][7] provide the ability to connect specific filesystem paths of the container back to the host machine. The mysql docker images use Volumes to keep data persisted across containers restarts. 

Sometimes its good to have a temporary container (flag `--rm`), those containers do not leave dangling volumes behind:

```sh
docker run 
  --rm 
  -p 3306:3306 
  --name mysql-sandbox 
  -e MYSQL_ROOT_PASSWORD=123456
  -d mysql:8.0
```

When a container is removed, an associated volume is not automatically removed as well. When a volume exists and is no longer connected to any containers, it's called a dangling volume.

## Run a Bash session

Sometimes its useful to have a Bash session in your favorite Linux distribution to test some commands:

```sh
docker run -it ubuntu /bin/bash
```

## Run with an explicit bind-mount

When working on an application, we can use a `bind-mount` to mount source code into the container and let it see code changes [right away](https://docs.docker.com/get-started/06_bind_mounts/):

```sh
docker run
  --mount type=bind,source="$(pwd)"/source_file.ext,target=/target_file.ext
  -it ubuntu /bin/bash
```

----


# Manage your resources

## Stop and delete containers

To stop all running containers:

```sh
docker stop $(docker ps -a -q)
```

To delete the stopped containers:

```sh
docker container prune
```

## Remove all unused volumes

Unused or dangling local volumes are those which are not referenced by any containers. Fist you can list them:

```sh
docker volume ls --filter "dangling=true"
```

Then, feel free to clean that up:

```sh
$ docker volume prune
```
 
## Full localhost clean

This command cleans up dangling volumes, networks, stopped containers and all unused images:

```sh
docker system prune -a
```


----


# Build what you need

## Build an image providing a name and tag

Assuming the `Dockerfile` with build instructions is in the curren directory:

```sh
docker build . --tag "name:tag"
```

If you build without specifying the `:tag` part, then `latest` will be it's value.

A docker image usually has 3 parts: 
- name
- tag
- digest

Names are usually linked to the software the image runs and tags are usually associated with the release version. The digest is an Id that is created during build time by hashing the image contents.

Images can be pulled using `name`, or `name:tag` or `name@sha256:digest`. If we do not specify a version tag we will pull the latest.

You can list the installed images with their Ids and digests by running:

```sh
docker image ls --digests
```

----


# Quick Backup and Restore

Messing up a local database installation can happen in a local development environment. There should be a quick way to backup and restore a local database state, right?

> TL;DR - This is accomplished backing up a MySQL container volume and restoring it into another container when desired.

First determine the target backup volume, you should know which volumes are being used by which containers:

```sh
$ docker inspect mysql-container-name
```

After you have found your [MySQL][5] container volume (old_volume), use the following command to backup it:

```sh
$ docker volume create --name new_volume 
$ docker container run
  --rm
  -it
  -v old_volume:/from
  -v new_volume:/to
  alpine ash -c "cd /from ; cp -av . /to"
```

Now spin up a new mysql instance based on the volume created:

```sh
$ docker run -p 127.0.0.1:3308:3306
  --name mysql-sandbox-copy
  -v new_volume:/var/lib/mysql
  -e MYSQL_ROOT_PASSWORD=123456
  -d mysql:8.0
```

----


# Initializing MySQL instance from a logical backup

Use a Dockerfile and the ADD command to insert your schema file into the /docker-entrypoint-initdb.d directory in the Docker container. The will run any files in this directory ending with ".sql":

```Dockerfile
FROM mysql:8.0

ENV MYSQL_ROOT_PASSWORD=123456

ADD schema.sql /docker-entrypoint-initdb.d

EXPOSE 3306
```

Then build it:

```sh
docker build . --tag my-pre-populated-db
```

Finally, run your database:

```sh
docker run 
  --rm 
  -p 3306:3306 
  --name my-pre-populated-container
  -d my-pre-populated-db
```

# References

* [Docker Run Command][1]
* [Docker Bridge Network][2]
* [Docker Inspect Command][3]
* [Docker Exec Command][4]
* [MySQL Docker Hub][5]
* [Docker Compose][6]
* [Docker Volume Types][7]

[1]: https://docs.docker.com/engine/reference/run/
[2]: https://docs.docker.com/network/bridge/
[3]: https://docs.docker.com/engine/reference/commandline/inspect/
[4]: https://docs.docker.com/engine/reference/commandline/exec/
[5]: https://hub.docker.com/_/mysql
[6]: https://docs.docker.com/compose/
[7]: https://stackoverflow.com/questions/47150829/what-is-the-difference-between-binding-mounts-and-volumes-while-handling-persist
