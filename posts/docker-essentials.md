---
title: "Docker Essentials"
date: "2021-12-17"
---

# Table of Contents

----

# Running

[Running containers][1] is the absolute minimum a developer need to know about docker :running: . Here are a few tips:

## Run and interact

Instead of installing a MySQL in your localhost for development purposes, just use Docker to simplify your life:

```bash
docker run -p 3306:3306
  --name mysql-sandbox
  --env MYSQL_ROOT_PASSWORD=123456
  --detach mysql:8.0
```

By default all containers are created inside the default [Docker Bridge-Network][2] and are assigned IPs on that network.

> - To find the instance internal IP you can [inspect][3] the instance
> - If you prefer referencing containers by name you can use [docker-compose][6].

If you want to connect to it from another container, you can do so by referencing it's Docker internal IP address:

```bash
docker run -it
  --rm mysql:8.0
  mysql -h172.17.0.3 -uroot -p123456
```

If you just want to *"log into"* your running container, use the [exec][4] command referencing it's name:

```sh
 docker exec -it mysql-sandbox bash
```

The command above starts an interactive Bash shell session inside the running Docker container named `mysql-sandbox`.

## Docker vs Filesystem

While containers can create, update, and delete files, those changes are lost when the container is removed and all changes are isolated to that container internal file system.  [Volumes][7] provide the ability to connect specific filesystem paths of the container back to the host machine. For example, the MySql Docker image make use of a volume to keep data persisted across containers restarts.

By default, when a container is removed, an associated volume is not automatically removed as well. Those are called a dangling volumes, because they're actually not being used by any active container.

Sometimes its good to have a temporary container (flag `--rm`), those containers do not leave dangling volumes behind:

```sh
docker run 
  --rm 
  -p 3306:3306 
  --name mysql-sandbox 
  -e MYSQL_ROOT_PASSWORD=123456
  -d mysql:8.0
```

## Filesystem vs Developer

When developing an application, we can use a `bind-mount` to mount source code into the container and let it see code changes [right away](https://docs.docker.com/get-started/06_bind_mounts/) :dancer: :

```sh
docker run
  --mount type=bind,source="$(pwd)"/source_file.ext,target=/target_file.ext
  -it ubuntu /bin/bash
```

## Simply Run Bash

Sometimes its useful to have a Bash session in your favorite Linux distribution to test some commands:

```sh
docker run -it ubuntu /bin/bash
```

----


# Resource Management

## Stop and delete containers

When you're working with Docker, you may need to stop and delete containers at various times, for example, to clean up resources or to remove an old container that's no longer needed.

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

From time to time, you should free up disk space on your Docker host machine by removing resources that are no longer in use. This command removes all stopped containers, unused networks, dangling images, and build cache from your Docker host machine:

```sh
docker system prune -a
```

----

# Build on the shoulders of giants

Docker allows you to create new Docker images to ship your application through a Dockerfile :rocket:. A Dockerfile is a text file that contains a set of instructions for building a Docker image.

I will not elaborate on the contents of the Dockerfile, instead I will describe how the CLI works.

## Build with a Name and Tag

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


# Ease Backup and Restore

Messing up a local database installation can happen in a local development environment. There should be a quick way to backup and restore a local database state, right? :sunglasses:

> TL;DR - This is accomplished backing up a container volume and restoring it into another container when desired.

First determine the target backup volume, you should know which volumes are being used by which containers:

```sh
$ docker inspect mysql-container-name
```

After you have found your container volume (old_volume), use the following command to backup it:

```sh
$ docker volume create --name new_volume 
$ docker container run
  --rm
  -it
  -v old_volume:/from
  -v new_volume:/to
  alpine ash -c "cd /from ; cp -av . /to"
```

Now spin up a new container based on the volume copy:

```sh
$ docker run -p 127.0.0.1:3308:3306
  --name mysql-sandbox-copy
  -v new_volume:/var/lib/mysql
  -e MYSQL_ROOT_PASSWORD=123456
  -d mysql:8.0
```

----


# MySQL from logical backup

Use a Dockerfile and the `ADD` command to insert your schema file into the `/docker-entrypoint-initdb.d` directory in the Docker container. That will run any files in this directory ending with ".sql" when the container first launch:

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
