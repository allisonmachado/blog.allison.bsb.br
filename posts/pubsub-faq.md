---
title: "Cloud Pub/Sub FAQ"
date: "2023-03-17"
---

# Table of Contents

# Introduction :bulb:

I tried, as much as possible, to put the questions in an order that require no previous knowledge of the Pub/Sub service. I hope it helps :wink: .

# Disclaimer :exclamation:

This post was used with the help of [ChatGPT][1] and some sentences from the [Cloud Pub/Sub][2] docs are just copied.
My intent is not to be a professional writer, I just want to condense information in a quick to read and absorb post.

# Basics

## What is Cloud Pub/Sub?

Cloud Pub/Sub is a fully-managed messaging service (a type of message broker or message queue) provided by Google Cloud Platform that enables asynchronous communication between systems or microservices at scale, decoupling senders and receivers in a flexible and reliable way.

## What are publishers?

In Google Cloud Pub/Sub, a publisher is an entity that sends messages to a Pub/Sub topic. Messages can be published to a topic either individually or in batches, and publishers can be part of an application or service that generates data or events to be consumed by subscribers.

## What are subscriptions?

In Google Cloud Pub/Sub, a subscription is a named resource representing the stream of messages from a single, specific topic, to be delivered to the subscriber application. 

Subscriptions can be configured with various settings such as acknowledgement deadline, filtering, and flow control to control how messages are delivered to subscribers. A single topic can have multiple subscriptions, but a subscription always point to a single topic.

## Can I send a big file using Pub/Sub?

Pubsub limits messages to 10MB, it's not possible to send a bigger file to a topic. To circumvent this limitation, you cloud indirectly send larger payloads by first storing them in a filesystem or an object-storage (like Cloud Storage or S3).

In other words, instead of sending the file itself for the target topic, we could publish the reference of the file already uploaded to the object-storage. Then, the subscriber receives the file "url" (or reference) and downloads the file to continue processing.

# System Design

## What are a few differences between Pub/Sub and Kafka?

Pub/Sub is made available as a managed service (which means that a lot of DevOps work is handled for you) while Kafka as an open source software. Pub/Sub initially behaved much like a message queue (e.g. Rabbit MQ) whereas Kafka would be better compared to a streaming log, making it really simple to "replay" messages.

In Kafka, it is up to the consumer to keep track of the offset of the last message it received, and to provide that information in subsequent requests. Pubsub works by the subscribers acknowledging the messages, the server control the lifecycle of the messages and by default deletes acknowledged ones. Pub/Sub also supports message delivery to push endpoints.

In Kafka messages are by default ordered. You can support this requirement in Pub/Sub using ordering keys. Currently, in Pub/Sub, ordering is guaranteed across messages published in a given region.

Both Kafka and Pubsub have options to configure the maximum message retention time. 

Amazon AWS Kinesis can be thought of as a managed Kafka whereas Pub/Sub can be thought of as a managed version of RabbitMQ on steroids.

## Should I worry about scalability in terms of message ingestion or delivery? 

When using Google Cloud Pub/Sub, you don't need to worry about the pubsub service scalability. Pub/Sub can handle millions of messages per second and automatically scales to meet the needs of your application, without any additional configuration required. Additionally, Pub/Sub provides global message routing and replication, which ensures that your messages are delivered reliably and quickly, regardless of where your publishers/subscribers are located.

However, you should keep in mind that the cost of using Pub/Sub will increase as you scale up your usage. You should also make sure that your subscriber applications are designed to handle the expected message volume and that you have enough resources available to process incoming messages. But in terms of the underlying Pub/Sub service itself, according to Google it's designed to scale.

## Are Pub/Sub servers located in a specific zone or region ?

Pub/Sub servers run in all Google Cloud regions around the world. This allows the service to offer fast, global data access, but also offers users control over where messages are stored. Cloud Pub/Sub provides global data access meaning that publisher and subscriber clients are not aware of the location of the servers to which they connect or how those services route the data internally.

Pub/Sub’s load balancing mechanisms direct publisher traffic to the nearest Google Cloud data center where data storage is possible. This means that publishers in multiple regions may publish messages to a single topic with low latency. When a subscriber requests messages published to a topic, it connects to the nearest server which aggregates data from all messages published to the topic.

## What are some important monitoring aspects to consider when using Pub/Sub?

The Pub/Sub docs states: *"Pub/Sub exports metrics by using Cloud Monitoring, which can help provide visibility into the performance, uptime, and overall health of your applications. You can ensure that your subscribers are keeping up with the flow of messages by monitoring the number of undelivered messages. To monitor undelivered messages, you could create alerts when the timestamp of the oldest unacknowledged message extends beyond a certain threshold. You could also monitor the overall health of the Pub/Sub service itself by monitoring the send request count metric and examining the response codes."*

# Terminology

## What does *"unacked message"* mean?

In the context of Google Cloud Pub/Sub, "unacked" is short for "unacknowledged", which refers to messages that have been delivered to a subscriber, but the subscriber has not yet acknowledged the successful processing of the message back to the server.

In other words, after a subscriber receives a message, it needs to process the message and send an acknowledgment back to the server to confirm that it has successfully processed the message. 

Until an acknowledgment is received by the server, the message is considered unacknowledged or "unacked".

## What does *"outstanding message"* mean?

In the context of Google Cloud Pub/Sub, an "outstanding" message refers to a message that has been sent to be processed, but has not yet been acknowledged by a subscriber.

In other words, If a message is sent out for delivery and a subscriber is yet to acknowledge it, the message is called outstanding. A message is considered outstanding until the acknowledgment deadline expires or the message is acknowledged.

# Subscription

## What's the difference between a subscriber and a subscription?

A subscriber is a client application or process that consumes messages from a Pub/Sub topic. A subscription is a named cloud resource that represents the stream of messages from a single, specific topic. A subscription is what allows one or more subscribers to receive messages from that topic.

When a subscriber connects to a subscription from a topic, it receives messages from that topic through the subscription. Each subscription has a unique name and it's possible to have multiple subscriptions associated with the same topic, each with its own set of subscribers.

## How does a subscription message processing work ?

After a message is sent to a subscriber, the subscriber must acknowledge the message. If a message is being processed and a subscriber is yet to acknowledge it, the message is called outstanding.

The subscriber has a configurable, limited amount of time, known as the ackDeadline, to acknowledge the outstanding message. After the deadline passes, the message is no longer considered outstanding, and Pub/Sub attempts to redeliver the message.

Pub/Sub repeatedly attempts to deliver any message that is not yet acknowledged and not outstanding.

## What is a subscription retry policy?

If Pub/Sub attempts to deliver a message but the subscriber can't acknowledge it, Pub/Sub tries to resend the message. How the redelivery attempt should occur is known as the subscription retry policy. This isn't a feature that you can turn on or off. However, you can choose what type of retry policy you want to use.

While trying redelivery, Pub/Sub continues to deliver other messages, even if previous messages received negative acknowledgments (unless, you're leveraging ordered message delivery).

## What are the types of subscription retry policies?

By default, messages are immediately redelivered to the same subscriber client if they are not acknowledged. However, this can cause issues if the conditions preventing the acknowledgment haven't changed, resulting in multiple resends. 

To address this, Pub/Sub offers an exponential backoff policy where progressively longer delays are added between retry attempts, with a maximum delay of 600 seconds.

## What are the subscription types?

There are two subscription types:

- Push subscriptions: Messages are pushed to an https endpoint specified by the subscription.

- Pull subscriptions: The subscriber client initiates requests to a Pub/Sub server to retrieve messages.

If you use pull subscriptions, the subscribers can be of two types:

- Simple pull subscribers.
- Streaming pull subscribers.

The primary difference between the two mechanisms is that a streaming pull subscriber can receive messages in near-real-time, as soon as they are available in the subscription, while a simple pull subscriber must issue requests periodically to retrieve messages. However, a streaming pull subscriber has higher resource usage and may require additional setup and configuration, whereas a pull subscriber is simpler to implement and can be more cost-effective for low-volume subscriptions.

## In a Push subscription, can I send messages to more than one endpoint?

No. In a push subscription type, you can only specify a single endpoint URL to receive messages. If you need to send messages to multiple endpoints, you will need to create separate push subscriptions for each endpoint. 

Alternatively, you can use pull subscriptions, where you can have multiple subscribers on a sngle subscription.

## Having multiple subscribers on a subscription change message delivery?

The image bellow, from the [Pub/Sub docs][2], exemplifies this scenario:

![MULTIPLE SUBSCRIBERS](images/posts/pubsub-multiple-subscribers.png 'MULTIPLE SUBSCRIBERS')
*Multiple Subscribers Scenario*

The scenario above illustrates the behavior of a pull subscription type. The first subscription has two subscribers, meaning messages will be load-balanced across them, with each subscriber receiving a subset of the messages. The second subscription has one subscriber that will receive all of the messages. 

In a push subscription type, there can be only one subscriber endpoint, but that doesn't mean messages are only processed one after the other. Unless message ordering is enabled, messages are sent to the registered endpoint as they arrive, and Pub/Sub adjusts the number of concurrent push requests using a slow-start algorithm.

# Message Lifecycle

## What happens to messages if we have a topic with no subscription?

The Pub/Sub docs states: *"Only messages published to the topic after the subscription is created are available to subscriber applications."*

If you have a topic in Google Cloud Pub/Sub with no active subscriptions, any messages published to that topic will be discarded and not delivered to any subscriber. In other words, Pub/Sub is designed to only deliver messages to active subscribers that have explicitly requested to receive messages from a particular topic. 

It's worth noting that if you create a subscription for a topic after messages have been published, those messages will not be delivered retroactively to the newly created subscription. The subscription will only receive new messages published after it was created.

## When does PubSub delete the received messages?

Assuming that the topic on which the message is published has at least one subscription attached to it, Pub/Sub tries to deliver messages to subscribers at the same time as writing the message to storage. After that, subscribers need to send an acknowledgement to Pub/Sub that they have processed the message. Once at least one subscriber for each subscription has acknowledged the message, Pub/Sub deletes the message from storage.

Pub/Sub servers can retain acknowledged messages, for a configured time, if we either:

- Enable message retention in the topic.
- Enable acknowledged message retention in the subscription.

The Pub/Sub docs states: *"Pub/Sub begins retaining messages on behalf of a subscription when the subscription is created. By default, Pub/Sub discards a message from a subscription as soon as the message is acknowledged. Unacknowledged messages are retained for a default of 7 days. Configuring a subscription to retain acknowledged messages lets you replay previously-acked messages retained by the subscription. You can configure messages to be retained for a maximum of 7 days in a subscription. This configuration applies to both acknowledged and unacknowledged messages. However, messages can be retained in a subscription for more than 7 days if the message retention duration configured on its topic is greater than 7 days"*.

## What happens to messages that can not be delivered or acknowledged by subscribers?

Pub/Sub persists messages that could not be delivered up to the subscription message retention duration. During that time, you can configure a subscription delivery retry policy. After expiration, or after the max number of delivery attempts, you can configure the forwarding of the "unacked" messages to a dead-letter topic.

A dead-letter topic is a subscription property, not a topic property. When you create a topic, you can't specify that the topic is a dead-letter topic. You create or update a subscription and use another topic as a dead-letter topic. 

If a message cannot be processed by a subscriber and is sent to a dead-letter topic, it is as if the message was acknowledged by the original subscriber. This means that the message will not be redelivered to the original subscriber and will not appear in subsequent pull requests from that subscriber.

In summary: If the Pub/Sub service attempts to deliver a message but the subscriber can't acknowledge it, Pub/Sub can forward the undeliverable message to a dead-letter topic.

# Message Replay

## Can Pub/Sub replay/resend deleted messages?

No, unless you use the PubSub Seek feature.

To seek to a time in the past and replay previously-acknowledged messages, you must first enable message retention on the topic or configure the subscription to retain acknowledged messages. Topic message retention also allows a subscription to replay messages that are published before you created a subscription.

If topic message retention is configured, the unacknowledged message is deleted from the subscription only when its age exceeds the maximum of the topic's and the subscription's retention duration property.

## How to replay messages?

It's possible to create subscription snapshots to capture the message acknowledgement state of a subscription at a given time. After that we *"seek to a snapshot"* to resend messages for a given subscription.

Another possibility is to *"seek to a timestamp"* to retrieve messages published after that timestamp, if message retention is enabled.

Note that, If you seek to a snapshot using a subscription with a filter, the Pub/Sub service only redelivers the messages in the snapshot that match the filter of the subscription making the seek request.

## Should I seek to a snapshot or to a timestamp?

PubSub Seek to a timestamp feature allows you to reset the subscription's cursor to a specified point in time. This means that you can rewind the subscription to an earlier point in time and receive messages again, including messages that were already acknowledged or unacknowledged.

When you seek to a timestamp, the subscription will start receiving messages that were published after the specified timestamp, **up to a limit of 31 days if message retention was enabled at the topic level**.

On the other hand, when you seek to a snapshot, you reset the cursor of a subscription to a specific snapshot. A snapshot is a point-in-time copy of a subscription's backlog, and it includes all the unacknowledged messages in the subscription at the time the snapshot was created. **When using a snapshot you are not required to enable message retention at a topic level.** A snapshot in Google Cloud Pub/Sub can only include messages up to a maximum retention period of 7 days.

### How does "seeking to a snapshot" work?

Once a subscription snapshot is created, it retains:

All messages that were unacknowledged in the source subscription at the time of the snapshot's creation. 
Any messages published to the topic thereafter.

One use case is to test subscriber code on known data - creating an isolated subscription for a topic and seeking to a created snapshot to replay the saved messages.

### How does "seeking to a timestamp" work?

In PubSub, after enabling message retention, seeking to a timestamp in a subscription marks every message received by Pub/Sub before that time as acknowledged, and all messages received after that time as unacknowledged - to replay and reprocess previously acknowledged messages in that subscription.

To seek to a timestamp, you must first configure the subscription to retain acknowledged messages. You only need to enable the retain of acknowledged messages if you intend to seek to a timestamp - seeking to a snapshot doesn't require it.

### Can snapshots last forever?

No, snapshots expire and are deleted in the following cases (whichever comes first):

- The snapshot reaches a lifespan of seven days.
- The oldest unacknowledged message in the snapshot exceeds the message retention duration of 7 days.
 
For example, consider a subscription whose oldest "unacked" message is 3 days old. If a snapshot is created from this subscription, the snapshot -- which will always capture this 3-day-old backlog as long as the snapshot exists -- will expire in 4 days.

* [ChatGPT][1]
* [Cloud Pub/Sub][2]
# References :books:
* [Pub/Sub vs Kafka][3]

[1]: https://chat.openai.com/chat
[2]: https://cloud.google.com/pubsub/docs/overview
[3]: https://cloud.google.com/pubsub/docs/migrating-from-kafka-to-pubsub
