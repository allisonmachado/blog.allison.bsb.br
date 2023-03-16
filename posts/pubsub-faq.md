---
title: "Cloud Pub/Sub FAQ"
date: "2023-03-17"
---

# Table of Contents

# Introduction :bulb:

I tried, as much as possible, to put the questions in an order that require no previous knowledge of the Pub/Sub service. I hope it helps :wink: .

# Disclaimer

This post was used with the help of [ChatGPT][1] and some sentences from the [Cloud Pub/Sub][2] docs are just copied.
My intent is not to be a professional writer, I just want to condense information in a quick to read and absorb post.

# What is Cloud Pub/Sub?

Cloud Pub/Sub is a fully-managed messaging service (a type of message broker or message queue) provided by Google Cloud Platform that enables asynchronous communication between systems or microservices at scale, decoupling senders and receivers in a flexible and reliable way.

# What are publishers?

In Google Cloud Pub/Sub, a publisher is an entity that sends messages to a Pub/Sub topic. Messages can be published to a topic either individually or in batches, and publishers can be part of an application or service that generates data or events to be consumed by subscribers.

# What are subscriptions?

In Google Cloud Pub/Sub, a subscription is a named resource representing the stream of messages from a single, specific topic, to be delivered to the subscriber application. 

Subscriptions can be configured with various settings such as acknowledgement deadline, filtering, and flow control to control how messages are delivered to subscribers. A single topic can have multiple subscriptions, but a subscription always point to a single topic.

# What are a few differences between Pub/Sub and Kafka?

Pub/Sub is made available as a managed service (which means that a lot of DevOps work is handled for you) while Kafka as an open source software. Pub/Sub initially behaved much like a message queue (e.g. Rabbit MQ) whereas Kafka would be better compared to a streaming log, making it really simple to "replay" messages.

In Kafka, it is up to the consumer to keep track of the offset of the last message it received, and to provide that information in subsequent requests. Pubsub works by the subscribers acknowledging the messages, the server control the lifecycle of the messages and by default deletes acknowledged ones. Pub/Sub also supports message delivery to push endpoints.

In Kafka messages are by default ordered. You can support this requirement in Pub/Sub using ordering keys. Currently, in Pub/Sub, ordering is guaranteed across messages published in a given region.

Both Kafka and Pubsub have options to configure the maximum message retention time. 

Amazon AWS Kinesis can be thought of as a managed Kafka whereas Pub/Sub can be thought of as a managed version of RabbitMQ on steroids.

# What does `unacked` message mean?

In the context of Google Cloud Pub/Sub, "unacked" is short for "unacknowledged", which refers to messages that have been delivered to a subscriber, but the subscriber has not yet acknowledged the successful processing of the message back to the server.

In other words, after a subscriber receives a message, it needs to process the message and send an acknowledgment back to the server to confirm that it has successfully processed the message. 

Until an acknowledgment is received by the server, the message is considered unacknowledged or `unacked`.

# What does `outstanding` message mean?

In the context of Google Cloud Pub/Sub, an "outstanding" message refers to a message that has been sent to be processed, but has not yet been acknowledged by a subscriber.

In other words, If a message is sent out for delivery and a subscriber is yet to acknowledge it, the message is called outstanding. A message is considered outstanding until the acknowledgment deadline expires or the message is acknowledged.

# Are Pub/Sub servers located in a specific zone or region ?

Pub/Sub servers run in all Google Cloud regions around the world. This allows the service to offer fast, global data access, but also offers users control over where messages are stored. Cloud Pub/Sub provides global data access meaning that publisher and subscriber clients are not aware of the location of the servers to which they connect or how those services route the data internally.

Pub/Sub’s load balancing mechanisms direct publisher traffic to the nearest Google Cloud data center where data storage is possible. This means that publishers in multiple regions may publish messages to a single topic with low latency. When a subscriber requests messages published to a topic, it connects to the nearest server which aggregates data from all messages published to the topic.

# What's the difference between a subscriber and a subscription?

A subscriber is a client application or process that consumes messages from a Pub/Sub topic. A subscription is a named cloud resource that represents the stream of messages from a single, specific topic. A subscription is what allows one or more subscribers to receive messages from that topic.

When a subscriber connects to a subscription from a topic, it receives messages from that topic through the subscription. Each subscription has a unique name and it's possible to have multiple subscriptions associated with the same topic, each with its own set of subscribers.

# How does a subscription message processing work ?

After a message is sent to a subscriber, the subscriber must acknowledge the message. If a message is being processed and a subscriber is yet to acknowledge it, the message is called outstanding.

The subscriber has a configurable, limited amount of time, known as the ackDeadline, to acknowledge the outstanding message. After the deadline passes, the message is no longer considered outstanding, and Pub/Sub attempts to redeliver the message.

Pub/Sub repeatedly attempts to deliver any message that is not yet acknowledged and not outstanding.

# What is a subscription retry policy?

If Pub/Sub attempts to deliver a message but the subscriber can't acknowledge it, Pub/Sub tries to resend the message. How the redelivery attempt should occur is known as the subscription retry policy. This isn't a feature that you can turn on or off. However, you can choose what type of retry policy you want to use.

While trying redelivery, Pub/Sub continues to deliver other messages, even if previous messages received negative acknowledgments (unless, you're leveraging ordered message delivery).

# What are the types of subscription retry policies?

By default, messages are immediately redelivered to the same subscriber client if they are not acknowledged. However, this can cause issues if the conditions preventing the acknowledgment haven't changed, resulting in multiple resends. 

To address this, Pub/Sub offers an exponential backoff policy where progressively longer delays are added between retry attempts, with a maximum delay of 600 seconds.

# What are the subscription types?

There are two subscription types:

- Push subscriptions: Messages are pushed to an https endpoint specified by the subscription.

- Pull subscriptions: The subscriber client initiates requests to a Pub/Sub server to retrieve messages.

If you use pull subscriptions, the subscribers can be of two types:

- Simple pull subscribers.
- Streaming pull subscribers.

The primary difference between the two mechanisms is that a streaming pull subscriber can receive messages in near-real-time, as soon as they are available in the subscription, while a simple pull subscriber must issue requests periodically to retrieve messages. However, a streaming pull subscriber has higher resource usage and may require additional setup and configuration, whereas a pull subscriber is simpler to implement and can be more cost-effective for low-volume subscriptions.

# In a Push subscription, can I send messages to more than one endpoint?

No. In a push subscription type, you can only specify a single endpoint URL to receive messages. If you need to send messages to multiple endpoints, you will need to create separate push subscriptions for each endpoint. 

Alternatively, you can use pull subscriptions, where you can have multiple subscribers on a sngle subscription.

# Having multiple subscribers on a subscription change message delivery?

The image bellow, from the [Pub/Sub docs][2], exemplifies this scenario:

![MULTIPLE SUBSCRIBERS](images/posts/pubsub-multiple-subscribers.png 'MULTIPLE SUBSCRIBERS')
*Multiple Subscribers Scenario*

The scenario above illustrates the behavior of a pull subscription type. The first subscription has two subscribers, meaning messages will be load-balanced across them, with each subscriber receiving a subset of the messages. The second subscription has one subscriber that will receive all of the messages. 

In a push subscription type, there can be only one subscriber endpoint, but that doesn't mean messages are only processed one after the other. Unless message ordering is enabled, messages are sent to the registered endpoint as they arrive, and Pub/Sub adjusts the number of concurrent push requests using a slow-start algorithm.


* [ChatGPT][1]
* [Cloud Pub/Sub][2]
# References :books:
* [Pub/Sub vs Kafka][3]

[1]: https://chat.openai.com/chat
[2]: https://cloud.google.com/pubsub/docs/overview
[3]: https://cloud.google.com/pubsub/docs/migrating-from-kafka-to-pubsub
