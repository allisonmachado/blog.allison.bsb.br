---
title: "HTTP Caching & CDN"
date: "2022-08-03"
---

### Introduction

The HTTP caching mechanism allows clients to store a response associated with a request, and reuse the response for subsequent requests.

When a server sends a response to a client, it can add headers that determine how the content will be cached by any of the locations participating in the communication:

* Browser (private from the user perspective)
* Proxy server (shared from the user perspective)
* CDN / Reverse Proxy Server (shared from the user perspective)

###### Terminology

The following terminology is useful for understanding web caching:

* Stale Content - cached content but already expired and not valid for use
* Fresh Content - cached and valid content for use
* Cache Invalidation - the process of removing any stale content from the cache
* Content Validation - the process of contacting the server to check if a stale cache content is still valid and can still be reused.
* Origin Server - the source of truth for fresh content

###### Private caches

A private cache is a cache tied to a specific client — typically a browser cache. If a response contains personalized content to a specific user and you want to store the response only in the private cache, the server should respond with a private directive:

`Cache-Control: private`

###### Shared caches

The shared cache is located between the client and the server and can store responses that can be shared among users. Managed caches are explicitly deployed by service developers to offload the origin server and to deliver content efficiently. Examples include CDNs and Service Workers using the Cache API semantics. 

> Carefully read the CDN documentation of whatever managed-cache mechanism you're using, and ensure you're controlling the cache properly in the ways described by the service documentation.

### Cache Key

The way that resources are distinguished from one another is essentially based the request Method and URL like `GET /image/cat.png`

> Take care to not up with a CDN caching and serving content to someone unauthenticated (because of the match in the method + url) for requests that actually requires authentication.

The [Vary](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary) HTTP response header describes the parts of the request message aside from the method and URL that influence the content cache. This can be used to create a cache key that considers more than only request Method and URL. 

### Fresh and Stale based on age

The criterion for determining when a response is fresh and when it is stale is age. **In HTTP, age is the time elapsed since the response was generated**. Consider the response:

```
HTTP/1.1 200 OK
Content-Type: text/html
Cache-Control: max-age=604800
...
```

This response will be available for reuse in response to client requests for one week after it is stored.


> The `Expires` header is deprecated and we should use `Cache-control: max-age` for specifying fresh/stale validation. If both are available, `max-age` is defined to be preferred.

### Content Validation

Stale responses are not immediately discarded. **HTTP has a mechanism to transform a stale response to a fresh one by asking the origin server.** This is called validation, or sometimes, revalidation. The headers `If-Modified-Since` and `If-None-Match` are sent by clients when the content becomes stale locally, that may allow the server to only return a `304 Not Modified` if the content has not changed since the specified time - thus saving bandwidth.


###### If-Modified-Since

If the response becomes stale and the cache cannot be reused, the client sends a request with an `If-Modified-Since` request header, to ask the server if there have been any changes made since the specified time. Upon receiving a 304 response, the client reverts the stored stale response back to being fresh and can reuse it reusing the initial max-age.


###### IF-None-Match (E-Tags)
E-Tags are a key (such as a hash of the body contents or a version number) that the server returns along with the response of a request (in the headers) like:

```
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1024
Date: Tue, 22 Feb 2022 22:22:22 GMT
ETag: "foobar"
Cache-Control: max-age=3600

<!doctype html>
...
```

When that response becomes stale, the client takes the value of the ETag response header for the cached response, and puts it into the `If-None-Match` request header, to ask the server if the resource has been modified.

### Avoid Caching

If you do not want a response to be saved for reuse, or If the server does not support conditional cache requests you should make the client access the server every time and always get the latest response.

To ensure that by default the latest versions of resources will always be transferred, it's common practice to make the default Cache-Control value include no-cache:

```
Cache-Control: no-cache
```

In addition, if the service implements cookies or other login methods, and the content is personalized for each user, private must be given too, to prevent sharing with other users:

```
Cache-Control: no-cache, private
```

### References

* [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#common_caching_patterns)
* [Cloud CDN](https://cloud.google.com/cdn/docs/caching)
* [HTTP caching overview](https://www.youtube.com/watch?v=HiBDZgTNpXY&t=528s)