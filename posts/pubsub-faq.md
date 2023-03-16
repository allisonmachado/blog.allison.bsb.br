---
title: "Cloud Pub/Sub FAQ"
date: "2023-00-00"
---

# Table of Contents

# Disclaimer

This post was used with the help of [ChatGPT][1] and some sentences from the [Cloud Pub/Sub][2] docs are just copied.
My intent is not to be a professional writer, I just want to condense information in a quick to read and absorb post.

# Introduction :bulb:

I tried, as much as possible, to put the questions in an order that require no previous knowledge of the Pub/Sub service. I hope it helps :wink: .

# What is Cloud Pub/Sub?

Cloud Pub/Sub is a fully-managed messaging service (a type of message broker or message queue) provided by Google Cloud Platform that enables asynchronous communication between systems or microservices at scale, decoupling senders and receivers in a flexible and reliable way.

# What are a few differences between Pub/Sub and Kafka?

Pub/Sub is made available as a managed service (which means that a lot of DevOps work is handled for you) while Kafka as an open source software. Pub/Sub initially behaved much like a message queue (e.g. Rabbit MQ) whereas Kafka would be better compared to a streaming log, making it really simple to "replay" messages.

In Kafka, it is up to the consumer to keep track of the offset of the last message it received, and to provide that information in subsequent requests. Pubsub works by the subscribers acknowledging the messages, the server control the lifecycle of the messages and by default deletes acknowledged ones. Pub/Sub also supports message delivery to push endpoints.

In Kafka messages are by default ordered. You can support this requirement in Pub/Sub using ordering keys. Currently, in Pub/Sub, ordering is guaranteed across messages published in a given region.

Both Kafka and Pubsub have options to configure the maximum message retention time. 

Amazon AWS Kinesis can be thought of as a managed Kafka whereas Pub/Sub can be thought of as a managed version of RabbitMQ on steroids.

# References :books:

* [ChatGPT][1]
* [Cloud Pub/Sub][2]
* [Pub/Sub vs Kafka][3]

[1]: https://chat.openai.com/chat
[2]: https://cloud.google.com/pubsub/docs/overview
[3]: https://cloud.google.com/pubsub/docs/migrating-from-kafka-to-pubsub
