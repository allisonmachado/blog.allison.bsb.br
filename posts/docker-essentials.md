---
title: "Docker Essentials for Devs"
date: "2021-12-17"
---

# Table of Contents

----

# Running :running:

[Running containers][1] is the absolute minimum a developer need to know about docker :running: . Here are a few tips:

## Run and interact

Instead of installing a MySQL in your localhost for development purposes, just use Docker to simplify your life:

```bash
docker run -p 3306:3306 \
  --name mysql-sandbox \
  --env MYSQL_ROOT_PASSWORD=123456 \
  --detach mysql:8.0.34
```

By default all containers are created inside the default [Docker Bridge-Network][2] and are assigned IPs on that network.

> - To find the instance internal IP you can [inspect][3] the instance
> - If you prefer referencing containers by name you can use [docker-compose][6].

If you want to connect to it from another container, you can do so by referencing it's Docker internal IP address:

```bash
docker run -it \
  --rm mysql:8.0.34 \
  mysql -h172.17.0.3 -uroot -p123456
```

If you just want to *"log into"* your running container, use the [exec][4] command referencing it's name:

```sh
 docker exec -it mysql-sandbox bash
```

The command above starts an interactive Bash shell session inside the running Docker container named `mysql-sandbox`.

## Internal vs Networking

Docker manages networking in a way that allows containers to communicate with each other and the outside world while maintaining isolation by default. There are some network modes that can be used, such as bridge, host, none. The bridge mode is the default, where a new network stack is created for the container on the docker bridge. The host mode allows the container to share the host’s network stack and is useful when the container needs to access network services running on the host itself.

### Bridge Network (default):
When you run a container without specifying a network, Docker creates a bridge network for it. Bridge networks are isolated from the host network but allow containers within the same network to communicate. Docker assigns a unique IP address to each container within the bridge network.

Docker allows you to map ports on the host to ports in a container. This is essential for allowing external access to services running in containers. For example, if you have a web server in a container listening on port 80, you can map it to port 8080 on the host, allowing you to access it using http://host_ip:8080.

### Host Network:
When you use --network="host" on a Linux host, it instructs Docker to run the container in the host's network namespace, effectively allowing it to share the same network stack as the host. This means the container can directly access host services on their ports.

Keep in mind that the --network="host" option in Docker is primarily designed [for Linux hosts][8] and does not work as expected on macOS or other non-Linux operating systems. 

On macOS, Docker Desktop runs a lightweight Linux VM under the hood to provide a Linux-like environment for Docker containers. However, macOS does not have the same "host" network namespace concept as Linux. When you use --network="host" on macOS, it has no effect on container networking. The container will continue to use its own network namespace, separate from the host's network.


## Docker vs Filesystem

In a containerized environment, any changes made to the container’s filesystem are lost when the container is removed. This is because a container’s filesystem only exists as long as the container does.

However, these changes are not lost if the container is only stopped and not removed. All changes are indeed isolated to that specific container’s internal filesystem.

As for [volumes][7], they provide a way to persist data and share it among containers. They allow specific filesystem paths of the container to be connected back to the host machine, providing more consistent storage that is **independent of the container**. This is especially important for stateful applications.

By default, when a container is removed, an associated volume is not automatically removed as well. Those are called a dangling volumes, because they're actually not being used by any active container.

Sometimes its good to have a temporary container (flag `--rm`), those containers do not leave dangling volumes behind:

```sh
docker run \
  --rm \
  -p 3306:3306 \
  --name mysql-sandbox \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -d mysql:8.0.34
```

## Filesystem vs Developer

When developing an application, we can use a `bind-mount` to mount source code into the container and let it see code changes [right away](https://docs.docker.com/get-started/06_bind_mounts/) :dancer:.

A bind mount is another type of volume, which lets you share a directory from the host's filesystem into the container. A bind mount is created when you provide a source path on the host machine in the command-line interface (CLI). This can be done using either the -v or --mount flags.

For example, with the -v flag, the syntax would look like this: 

```sh
docker run -v /path/on/host:/path/in/container my-container
```

Here, `/path/on/host` is the path to the file or directory on the host machine, and `/path/in/container` is the path where the file or directory is mounted in the container.

Similarly, with the --mount flag, the syntax would be: 

```sh
docker run --mount type=bind,src=/path/on/host,target=/path/in/container my-container
```

In this case, src is the path to the file or directory on the host machine, and target is the path where the file or directory is mounted in the container.

Any changes to the files in a bind mounted directory on the host machine are immediately available within the container.

## Simply Run Bash

Sometimes its useful to have a Bash session in your favorite Linux distribution to test some commands:

```sh
docker run -it ubuntu /bin/bash
```

----


# Resource Management :money_with_wings:

## Containers

When you're working with Docker, you may need to stop and delete containers at various times, for example, to clean up resources or to remove an old container that's no longer needed.

To stop all running containers:

```sh
docker stop $(docker ps -a -q)
```

To delete the stopped containers:

```sh
docker container prune
```

## Volumes

Unused or dangling local volumes are those which are not referenced by any containers. Fist you can list them:

```sh
docker volume ls --filter "dangling=true"
```

Then, feel free to clean that up:

```sh
$ docker volume prune
```
 
## System

From time to time, you should free up disk space on your Docker host machine by removing resources that are no longer in use. This command removes all stopped containers, unused networks, dangling images, and build cache from your Docker host machine:

```sh
docker system prune -a
```

----

# Build it rock solid :european_castle:

Docker allows you to create new Docker images to ship your application through a Dockerfile :rocket:. A Dockerfile is a text file that contains a set of instructions for building a Docker image.

I will not elaborate on how to create Dockerfiles, instead I will just describe how the CLI works. If you are interested in [creating your own Dockerfiles][10], make sure to read about the best practices and understand the difference between [CMD and ENTRYPOINT][11].

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


# Backup and Restore :dvd:

Messing up with a local database installation can happen in a local development environment, hence there should be a quick way to backup and restore a local database state, right? :sunglasses:

> TL;DR - This is accomplished backing up a container volume and restoring it into another container when desired.

First determine the target backup volume, you should know which volumes are being used by which containers:

```sh
$ docker inspect mysql-container-name
```

After you have found your container volume (old_volume), use the following command to backup it:

```sh
$ docker volume create --name new_volume 
$ docker container run \
  --rm \
  -it \
  -v old_volume:/from \
  -v new_volume:/to \
  alpine ash -c "cd /from ; cp -av . /to"
```

Now spin up a new container based on the volume copy:

```sh
$ docker run -p 127.0.0.1:3308:3306 \
  --name mysql-sandbox-copy \
  -v new_volume:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -d mysql:8.0.34
```

----


## MySQL from logical backup

Use a Dockerfile and the `ADD` command to insert your [schema file][9] into the `/docker-entrypoint-initdb.d` directory in the Docker container. That will run any files in this directory ending with ".sql" when the container first launch:

```Dockerfile
FROM mysql:8.0.34

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
docker run  \
  --rm  \
  -p 3306:3306  \
  --name my-pre-populated-container \
  -d my-pre-populated-db
```

## MySQL from a physical backup

It's really practical to backup a local database if we use bind mounts. 
We could simulate a [physical backup][9], which are taken by directly copying the database files from the storage medium where MySQL data is stored.

First let's run a container like this:

```sh
docker run -d \
    --name test-database \
    -p 127.0.0.1:3306:3306 \
    -v ~/Workspace/docker-volumes/test-database:/var/lib/mysql mysql:8.0.34
```

All mysql data will be saved on the host path:

- **~/Workspace/docker-volumes/test-database**

Therefore, it's just a matter of copying the files in the host and zipping them! :package:

# References :books:

* [Docker Run Command][1]
* [Docker Bridge Network][2]
* [Docker Inspect Command][3]
* [Docker Exec Command][4]
* [MySQL Docker Hub][5]
* [Docker Compose][6]
* [Docker Volume Types][7]
* [Linux Docker Engine][8]
* [Backup types][9]
* [Dockerfile best practices][10]
* [Entrypoint vs CMD][11]

[1]: https://docs.docker.com/engine/reference/run/
[2]: https://docs.docker.com/network/bridge/
[3]: https://docs.docker.com/engine/reference/commandline/inspect/
[4]: https://docs.docker.com/engine/reference/commandline/exec/
[5]: https://hub.docker.com/_/mysql
[6]: https://docs.docker.com/compose/
[7]: https://stackoverflow.com/questions/47150829/what-is-the-difference-between-binding-mounts-and-volumes-while-handling-persist
[8]: https://docs.docker.com/engine/install/ubuntu/
[9]: https://dev.mysql.com/doc/refman/8.0/en/backup-types.html
[10]: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/
[11]: https://www.youtube.com/watch?v=U1P7bqVM7xM