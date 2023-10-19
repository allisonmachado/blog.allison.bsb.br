---
title: "Nginx Docker Labs"
date: "2023-10-19"
---

# Table of Contents

# Introduction :bulb:

// TODO: Introduction

...

# Disclaimer :exclamation:

This post was used with the help of multiple [References](#user-content-references-books), [ChatGPT][1] and the [Cloud Tasks][2] docs.
A few sentences are just copied from the sources because my intent is not to be a professional writer, I just want to condense information in a quick to read and absorb way.

----


## 1. [Static Http Server](https://github.com/allisonmachado/nginx-docker-labs/tree/master/static-http-server)

// TODO: A basic http file server configuration...

```c
events {}
http {
  server {
    location / {
        root /data/www;
    }

    location /images/ {
        root /data/;
    }
  }
}
```


## 2. [Simple Proxy Server](https://github.com/allisonmachado/nginx-docker-labs/tree/master/simple-proxy-server)

// TODO: A minimal reverse proxy config for a node.js application with a path rewrite example.

```c
events {}
http {
  server {
    location / {
        root /data/www;
    }

    location /images/ {
        root /data/;
    }

    location /api {
        proxy_pass http://host.docker.internal:9000;
        rewrite ^/api(/.*)$ $1 break;
    }
  }
}
```

## 3. [Named Proxy Server](https://github.com/allisonmachado/nginx-docker-labs/tree/master/named-proxy-server)

// TODO: A reverse proxy where requests are routed by their host name.

```c
events
{
}
http
{
	server
	{
		listen 80;
		server_name app.train.local;
		location /
		{
			proxy_pass http://host.docker.internal:9000;
		}
	}

	server
	{
		listen 80;
		server_name cms.train.local;
		location /
		{
			proxy_pass http://host.docker.internal:7000;
		}
	}
}

```

## 4. [Load Balancer Server](https://github.com/allisonmachado/nginx-docker-labs/tree/master/named-proxy-server)

// TODO: Use nginx as a very efficient HTTP load balancer to distribute traffic to multiple servers.

```c
events
{
}
http {
    upstream stateless_app {
        server host.docker.internal:5000;
        server host.docker.internal:7000;
        server host.docker.internal:9000;
    }

    server {
        listen 80;

        location / {
            proxy_pass http://stateless_app/;
        }
    }
}
```

# Conclusion 

// TODO: Introduction

----

# References :books:

* [ChatGPT][1]
* [Nginx Documentation][2]
* [Docker Documentation][3]

[1]: https://chat.openai.com/chat
[2]: https://nginx.org/en/docs/
[3]: https://docs.docker.com/get-started/overview/

----
