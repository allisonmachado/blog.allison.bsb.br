---
title: "Nginx Docker Labs"
date: "2023-10-19"
---

# Table of Contents

# Introduction :bulb:

Nginx, a powerful web server and reverse proxy, is a crucial component for managing and optimizing web traffic. In this blog post, we'll explore various Nginx configurations, each serving a distinct purpose. From serving static files to acting as a load balancer, Nginx is a versatile tool that can help with the performance, security, and scalability of your web applications.

All the source code bellow can be easily downloaded and executed [cloning this github][4] repository! :sunglasses:

# Disclaimer :exclamation:

This post was used with the help of multiple [References](#user-content-references-books), [ChatGPT][1] and the [Cloud Tasks][2] docs.
A few sentences are just copied from the sources because my intent is not to be a professional writer, I just want to condense information in a quick to read and absorb way.

----


# 1. [Static Http Server](https://github.com/allisonmachado/nginx-docker-labs/tree/master/static-http-server)

**A basic http file server configuration...**

In the following Nginx configuration, we establish a basic HTTP server for serving static files:

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

This configuration sets up an HTTP server that listens for incoming requests on the default port 80 and serves files from the specified directories. The first location block serves files from `/data/www`, while the second location block serves files from `/data/images` when the URL path begins with `/images/`.

# 2. [Simple Proxy Server](https://github.com/allisonmachado/nginx-docker-labs/tree/master/simple-proxy-server)

**A minimal reverse proxy config for a node.js application with a path rewrite example...**

This Nginx configuration demonstrates the use of Nginx as a reverse proxy for a Node.js application with path rewriting:

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

In this configuration, Nginx proxies requests to a Node.js application running on `http://host.docker.internal:9000`. This is a way to access a process running in the host from a docker container.

This configuration also includes a path rewriting rule to remove the `/api` prefix from the incoming requests, ensuring that the application receives correct path without this prefix.

# 3. [Named Proxy Server](https://github.com/allisonmachado/nginx-docker-labs/tree/master/named-proxy-server)

**A reverse proxy example where requests are routed by their host name...**

This Nginx configuration showcases a reverse proxy setup that routes requests based on their header host name:

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

In this configuration, Nginx listens on port 80 and routes requests to different backend services based on the server_name specified in the HTTP host header. Requests with the host name `app.train.local` are directed to a service running on `http://host.docker.internal:9000`, while those with the host name `cms.train.local` are routed to a service running on `http://host.docker.internal:7000`.

# 4. [Load Balancer Server](https://github.com/allisonmachado/nginx-docker-labs/tree/master/named-proxy-server)

**Use Nginx as an HTTP load balancer to distribute traffic to multiple servers...**

This Nginx configuration illustrates how to use Nginx as a load balancer for distributing traffic among multiple servers:

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

Here, we define an upstream group called `stateless_app` that includes multiple backend servers. Nginx load-balances incoming requests across these servers, ensuring efficient distribution of traffic. This configuration uses [round-robin][5] by default.

# Conclusion 

Nginx is a versatile tool that can be configured to serve various purposes in your web infrastructure. From basic file serving to advanced reverse proxy and load balancing, Nginx plays a significant role in optimizing web application performance and reliability. 

Understanding these basic config setups can empower you to leverage Nginx for a wide range of web server and proxying use cases!

----

# References :books:

* [ChatGPT][1]
* [Nginx Documentation][2]
* [Docker Documentation][3]
* [Source Code][4]
* [Round Robin LB][5]

[1]: https://chat.openai.com/chat
[2]: https://nginx.org/en/docs/
[3]: https://docs.docker.com/get-started/overview/
[4]: https://github.com/allisonmachado/nginx-docker-labs
[5]: https://www.nginx.com/resources/glossary/round-robin-load-balancing/

----
