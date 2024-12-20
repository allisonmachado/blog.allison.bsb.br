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

If you want to connect to it from another container (also from default bridge network), you can do so by referencing it's Docker internal IP address:

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

## Networking

Docker manages networking in a way that allows containers to communicate with each other and the outside world while maintaining isolation by default. There are some network modes that can be used, such as bridge, host, none. The bridge mode is the default, where a new network stack is created for the container on the docker bridge. The host mode allows the container to share the host’s network stack and is useful when the container needs to access network services running on the host itself.

### Bridge Network (default):
When you run a container without specifying a network, Docker creates a bridge network for it. Bridge networks are isolated from the host network but allow containers within the same network to communicate. Docker assigns a unique IP address to each container within the bridge network.

Docker allows you to map ports on the host to ports in a container. This is essential for allowing external access to services running in containers. For example, if you have a web server in a container listening on port 80, you can map it to port 8080 on the host, allowing you to access it using http://host_ip:8080.

### Host Network:
When you use `--network="host"` on a Linux host, it instructs Docker to run the container in the host's network namespace, effectively allowing it to share the same network stack as the host. This means the container can directly access host services on their ports.

Keep in mind that the `--network="host"` option in Docker is primarily designed [for Linux hosts][8] and does not work as expected on macOS or other non-Linux operating systems. 

On macOS, Docker Desktop runs a lightweight Linux VM under the hood to provide a Linux-like environment for Docker containers. However, macOS does not have the same "host" network namespace concept as Linux. When you use `--network="host"` on macOS, it has no effect on container networking. The container will continue to use its own network namespace, separate from the host's network.


## Filesystem

In a containerized environment, any changes made to the container’s filesystem are lost when the container is removed. This is because a container’s filesystem only exists as long as the container does.

However, these changes are not lost if the container is only stopped and not removed. All changes are indeed isolated to that specific container’s internal filesystem.

As for [volumes][7], they provide a way to persist data and share it among containers. They allow specific filesystem paths of the container to be connected back to the host machine, providing more consistent storage that is **independent of the container**. This is especially important for stateful applications.

Note that by default, when a container is removed, an associated volume is not automatically removed as well. That can lead to forgotten dangling volumes, because they're actually not being used by any active container. To have a temporary container that do not leave dangling volumes behind use the `--rm` flag:

```sh
docker run \
  --rm \
  -p 3306:3306 \
  --name mysql-sandbox \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -d mysql:8.0.34
```

## Local Development

When developing an application, we can use a `bind-mount` to mount source code into the container and let it see code changes [right away](https://docs.docker.com/get-started/06_bind_mounts/) :dancer:.

A bind mount is another type of volume, which lets you share a directory from the host's filesystem into the container. A bind mount is created when you provide a source path on the host machine in the command-line interface (CLI). This can be done using either the -v or --mount flags.

For example, with the -v flag, the syntax would look like this: 

```sh
docker run -v /path/on/host:/path/in/container my-container
```

Here, `/path/on/host` is the path to the file or directory on the host machine, and `/path/in/container` is the path where the file or directory is mounted in the container. Similarly, with the --mount flag, the syntax would be: 

```sh
docker run --mount type=bind,src=/path/on/host,target=/path/in/container my-container
```

In this case, src is the path to the file or directory on the host machine, and target is the path where the file or directory is mounted in the container. Any changes to the files in a bind mounted directory on the host machine are immediately available within the container.

## Simply Bash

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

# Just Build It :european_castle:

Docker allows you to create new Docker images to ship your application through a Dockerfile :rocket:. A Dockerfile is a text file containing a set of instructions to build a Docker image, defining the environment and dependencies required for your application's containers. The best place to understand the structure and syntax of this file is [the official docker documentation][10].

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

Images can be pulled using `name`, or `name:tag` or `name@sha256:digest`. If a version tag is not specified Docker will pull the latest.

You can list the installed images with their Ids and digests by running:

```sh
docker image ls --digests
```

## CMD vs ENTRYPOINT

In a Dockerfile, `ENTRYPOINT` and `CMD` instructions define what command gets executed when running a container. The main difference between them is how they interact with the docker run command and how they can be overridden.

The `ENTRYPOINT` instruction allows you to configure a container that will run as an executable. The command following the `ENTRYPOINT` instruction gets executed when the container starts up. This command does not get overridden from the docker run command line arguments. Dockerfile example:

```dockerfile
FROM ubuntu
ENTRYPOINT ["echo", "Hello"]
```

Corresponding docker run command:
```sh
docker run <image> World # Output: Hello World
```

The `CMD` instruction provides defaults for an executing container but can be overridden by providing command line arguments to docker run. Dockerfile example:

```dockerfile
FROM ubuntu
CMD ["echo", "Hello"]
```

Corresponding docker run command (notice you need to provide the executable):
```sh
docker run <image> echo "Hello" # Output: World
```

In summary, `ENTRYPOINT` is designed to make your container behave like a standalone executable, while `CMD` is used to provide default arguments that can be overridden from the command line when docker run is used. If both are used in the same Dockerfile, `CMD` values will be appended to `ENTRYPOINT` values.

## Dockerfile Debug

Imagine you need to create a docker image with specific configuration for your application and you need to debug this process along the way. It is possible to apply a series of instructions in a dockerfile and pause to see if the modifications took effect.

Let's take a look at the simplest example possible, consider this dockerfile:

```dockerfile
FROM ubuntu
RUN apt update
RUN apt install -y nodejs
```

Before adding more instructions to this file, you want to make sure the `nodejs` installation instructions are applied successfully. In order to do that, what you can do is to effectively build this image:

```sh
docker build . --tag docker-playground
```

After that you can spawn a container from this image by providing the `bash` command, but note that you need to use the `-it` flag to start an interactive session:

```sh
docker run -it docker-playground bash
```

Finally you can see if `nodejs` is successfully installed inside the container:

```sh
root@docker-playground:/# node -v
v18.19.1
```

## Multistage Builds

Multistage builds are a feature that allows you to create more efficient images by using multiple build stages within a single `Dockerfile`. This feature is particularly useful for creating smaller, more optimized images, as well as simplifying the build process for complex applications.

The basic idea behind multistage builds is to use one set of build stages to compile and build your application, and then copy only the necessary artifacts into a final stage, discarding any unnecessary intermediate build dependencies. This can significantly reduce the size of the final Docker image.

Let's see an example:

```dockerfile
FROM node:18 AS builder
  WORKDIR /app
  COPY package*.json .
  COPY src ./src
  COPY tsconfig.json .
  RUN npm ci --omit=optional --audit=false --fund=false --ignore-scripts
  RUN npm run build

FROM node:18 AS runner
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --omit=optional --omit=dev --audit=false --fund=false --ignore-scripts
  COPY --from=builder /app/dist ./dist
  RUN useradd -m nodeuser
  USER nodeuser
  CMD ["node", "dist/index.js"]
```

In the `Dockerfile` above, the first stage called `builder` copies and install all necessary files for compiling a nodejs typescript application. In the second stage called `runner`, we copy the generated javascript files and install only production dependencies, creating an optimized docker image - the first `builder` layer will get discarded.

----

# Backup and Restore :dvd:

Messing up with a local database installation can happen in a local development environment, hence there should be a quick way to backup and restore a local database state, right? :sunglasses:

## Volumes with no bind mounts

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