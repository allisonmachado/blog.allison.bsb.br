---
title: "Cloud Tasks FAQ"
date: "2023-06-20"
---

# Table of Contents

# Introduction :bulb:

I tried, as much as possible, to put the questions in an order that require no previous knowledge of the Cloud Tasks service. I hope it helps me and you :wink: .

# Disclaimer :exclamation:

This post was used with the help of multiple [References](#user-content-references-books) and the [Cloud Tasks][2] docs.
A few sentences are just copied from the sources because my intent is not to be a technical writer, I just want to condense information in a quick to read and absorb way.

----

# Basics :bricks:

## What is Cloud Tasks?

Cloud Tasks is a managed asynchronous task execution service provided by Google Cloud Platform (GCP). It allows you to create and manage tasks that can be executed in the background, either immediately or at a later scheduled time, and at scale.

Cloud Tasks provides a simple API for creating and managing tasks, and it can integrate with a variety of execution environments, including Google Cloud Functions, Google Cloud Run, and even third-party systems.

Overall, Cloud Tasks can be a valuable tool for managing and executing asynchronous tasks execution.

## What are Tasks and Queues?

A task is a unit of work that you want to run, and a queue is a container for a set of related tasks. In Cloud Tasks, queues are used to manage the scheduling and execution of tasks.

## How to use it?

The Cloud Tasks [documentation][2] states:

1. You create a worker to process the tasks.
    - HTTP endpoint with a public IP address.
2. You create a queue.
    - It can take a few minutes for a newly created queue to be available.
3. You programmatically asks Cloud Tasks to add a new task.
    - You specify the service and handler that process the task, and optionally pass task-specific data along to the handler.
4. The Cloud Tasks service returns an OK to the originating application and saves it to storage.
6. The worker processes the task.
7. To complete the sequence, the worker informs the successful processing to the Cloud Tasks service.

![CLOUD TASKS WORKFLOW](images/posts/cloud-tasks-workflow.png 'CONSISTENT FOR UPDATE')
[*Cloud Tasks queues with HTTP targets*][3]

## What properties to consider when creating a Queue?

When creating a new queue in Cloud Tasks, there are several properties that you should consider based on your application's needs. Here are some important properties to consider:

- Name: Each queue is a named resource and must have a unique name within the project.
- Rate limits: You can set a maximum number of dispatches per second and maximum concurrent task dispatches.
- Retry settings: You can configure how many times Cloud Tasks should retry a failed task, and how long to wait between retries.

By considering these properties when creating a new queue in Cloud Tasks, you can ensure that your tasks are executed efficiently and reliably according to your application's specific needs.

## Can I publish a task while the Queue is paused?

The Cloud Tasks [documentation][2] states: *"If a queue is paused then the system will stop executing the tasks in the queue until it is resumed. Tasks can still be added when the queue is paused."*

## How to send a big file using Cloud Tasks?

Cloud Tasks is not designed to handle the transfer of large files directly, it limits messages to 1MB, it's not possible to send a task with a bigger payload. To circumvent this limitation, you could indirectly send larger payloads by first storing them in a filesystem or an object-storage (like Cloud Storage or S3).

In other words, instead of sending the file itself in the task, we could create a task with the reference of the file already uploaded to the object-storage. Then, the worker receives the file "url" (or reference) and downloads the file to continue processing.


# System Design :globe_with_meridians:

In terms of simplicity to use at the Google Cloud ecosystem, I would list the services as follows, from the simplest to the most complex to master:

- Cloud Scheduler
- Cloud Tasks
- Cloud Pub/Sub

Despite it's simplicity there are some nuances to consider when using the Google Cloud Tasks service. Cloud Tasks is designed for asynchronous work and does not provide strong guarantees around the timing of task delivery, making it unsuitable for interactive applications where a user is waiting for the result. Some typical use cases for Cloud Tasks include delegating potentially slow background operations like database updates to a worker, helping smooth traffic spikes by removing non-user-facing tasks from the main user flow, and scheduling API calls for system integration.

## How does it differ from Pub/Sub?

Overall, Cloud Tasks is better suited for situations where publishers require more control over the execution of tasks (publishers can specify an endpoint where each message is delivered), while Pub/Sub is designed for scenarios where publishers need to decouple themselves from subscribers and allow for implicit invocation of tasks.

Cloud Tasks provides tools for queue and task management that Pub/Sub does not have, such as scheduling specific delivery times, delivery rate controls and task/message creation deduplication. Pub/Sub is also more suitable for cases where message [ingestion throughput][6] is high.

For a detailed comparison [check this link][4].

## How does it differ from Cloud Scheduler?

In short, Cloud Tasks is designed for executing background tasks, while Cloud Scheduler is designed for triggering HTTP/S endpoints and executing jobs at a fixed interval period.

The biggest remark is that Cloud Tasks triggers actions based on how the individual task object is configured. If the `scheduleTime` field is set, the action is triggered at that time. If the field is not set, the queue processes its tasks in a non-fixed order.

For a detailed comparison [check this link][5].

## What the code to create a task look like?

```javascript
const {CloudTasksClient} = require('@google-cloud/tasks');

const client = new CloudTasksClient();

async function createHttpTask(project, location, queue) {
  const parent = client.queuePath(project, location, queue);

  const task = {
    httpRequest: {
      headers: {
        'Content-Type': 'text/plain',
      },
      httpMethod: 'POST',
      url: 'https://my.worker.com/handle',
    },
  };

  const [response] = await client.createTask({
    parent,
    task,
  });

  return response;
}
```

## How costly is it to use Cloud Tasks?

The [pricing model][7] for the Cloud Tasks service seems to be really simplified and it looks like not tied to how many queues you have. 

The billing is based on the concept of a billable operation which is an API call or push delivery attempt. In general, a million billable operation costs $0.40.

Therefore, if we consider one 1 task being created per second, it would be less than 3 million tasks being pushed per month for a cost of under $2 dollars. Of course the total cost of the system should add the maintenance of the worker processors to handle tasks.

## Should I worry about scalability in terms of Tasks ingestion and processing?

Yes, the Cloud Tasks [documentation][8] states: *"Google's infrastructure is designed to operate elastically at high-scale: most layers can adapt to increased traffic demands up to massive scale. A core design pattern that makes this possible is adaptive layers -- infrastructure components that dynamically re-allocate load based on traffic patterns. This adaptation, however, takes time. Because Cloud Tasks enables very high volumes of traffic to be dispatched, it exposes production risks in situations where traffic can climb faster than the infrastructure can adapt."*

## Does Cloud Task support the "fan-out" pattern?

In a fan-out pattern, a "sender" broadcasts a message to multiple "destinations", which can be other applications, services, or devices. Each destination receives a copy of the message and can process it independently, without affecting the processing of other destinations.

This is not built into the Cloud Tasks service like it is in Pub/Sub for instance (multiple subscriptions for a single topic).

The closest we can get to that is by creating multiple tasks for a single message, each of which is processed by a separate worker.

## Are Queue servers located in a specific zone or region?

When you create a Cloud Tasks queue, you can specify the location of the queue by using the `--location` flag in the gcloud command-line tool. The location you choose determines the region in which the queue metadata and task payloads are stored.

Note that the location you choose for your queue can affect the performance and latency of your Tasks. It's important to choose a location that is closest to your services to minimize latency and ensure optimal performance.

## What happens to Tasks that can not be processed by workers?

Tasks cannot be processed, therefore failed, because the worker is unreachable or because it returns a status code not in the 200-299 range.

There is a time limit for retrying a failed task, measured from when the task was first run. This time limit is set by the `--max-retry-duration` parameter. 

Once the `--max-retry-duration` time has passed and the task has been attempted `--max-attempts` times, **no further attempts will be made and the task will be deleted**.

## Are Tasks persisted to storage?

When you create a task in Google Cloud Tasks, it is added to a queue, which persists the task until it is successfully executed. Once tasks are added, the queue dispatches them and makes sure they are reliably processed by your workers.

If Cloud Tasks receives a successful response from the task’s target, then the task will be deleted.

## Can I replay Tasks already processed?

Tasks are processed once and after that they're gone from the Queues. 

So it means that, to reprocess a task that has already been processed by a worker in GCP Cloud Tasks, you need to create a new task with the same payload and attributes as the original task.

## Are Tasks processed in order?

No, the Cloud Tasks [documentation][8] states: *"With the exception of tasks scheduled to run in the future, task queues are completely agnostic about execution order. There are no guarantees or best effort attempts made to execute tasks in any particular order. Specifically: there are no guarantees that old tasks will execute unless a queue is completely emptied. A number of common cases exist where newer tasks are executed sooner than older tasks, and the patterns surrounding this can change without notice."*

## Can I delete a Task that is pending to be processed?

Yes, you can delete a Task that is pending to be processed in GCP Cloud Tasks.

To do so, you need to use the Cloud Tasks API or the Cloud Console to delete the task. The exact steps will depend on which method you choose.

Using the Cloud Tasks API, you can use the `deleteTask` method to delete the task. You will need to provide the name of the task as a parameter. The name should include the project ID, the location of the queue, and the task ID:

```javascript
  const name = 'projects/PROJECT_ID/locations/LOCATION_ID/queues/QUEUE_ID/tasks/TASK_ID'

  const tasksClient = new CloudTasksClient();

  async function callDeleteTask() {
    const task = {
      name,
    };

    const response = await tasksClient.deleteTask(task);
    console.log(response);
  }
```

## Are Tasks guaranteed to be processed exactly once by workers?

No, the Cloud Tasks [documentation][8] states: *"Cloud Tasks aims for a strict "execute exactly once" semantic. However, in situations where a design trade-off must be made between guaranteed execution and duplicate execution, the service errs on the side of guaranteed execution. As such, a non-zero number of duplicate executions do occur. Developers should take steps to ensure that duplicate execution is not a catastrophic event. In production, more than 99.999% of tasks are executed only once."*

# Configuration :gear:

## Can we control the flow of tasks processing?

Yes, throttling tasks consumption is supported by Cloud Tasks. For example, when creating a queue we can use the `--max-concurrent-dispatches` parameter to set the maximum number of concurrent tasks that Cloud Tasks allows to be dispatched for this queue. After this threshold has been reached, Cloud Tasks stops dispatching tasks until the number of outstanding requests decreases.

We can also use the `--max-dispatches-per-second` parameter to set the maximum rate at which tasks are dispatched from this queue. 

## Can we control the retry of unprocessed tasks?

Yes, the Cloud Tasks [documentation][8] states: *"If a task does not complete successfully, then Cloud Tasks will retry the task with exponential backoff according to the parameters you have set. You can specify the maximum number of times to retry failed tasks in the queue, set a time limit for retry attempts, and control the interval between attempts."*

## What are some important monitoring aspects to consider when using Cloud Tasks?

Here are some key metrics to keep monitoring and maybe create alerts about:

1. Queue depth: The number of tasks in the queue.
2. Task attempt count: Count of task attempts broken down by response code.
3. Task attempt delay: Delay between each scheduled attempt time and actual attempt time in milliseconds.

We can investigate if our workers are keeping up with the flow of tasks by monitoring the numbers above.

## What is the maximum Task retention period?

According to [the documentation][10]:

| Max task retention                       | 31 days  |
|------------------------------------------|----------|
| Maximum future schedule time for a task  | 30 days  |

31 days is the time between when a task is added to a queue and when it is automatically deleted.
30 days is the maximum amount of time in the future that a task can be scheduled.

----

# References :books:

* [ChatGPT][1]
* [Cloud Tasks][2]
* [Cloud Tasks queues with HTTP targets][3]
* [Cloud Tasks vs Pub/Sub][4]
* [Cloud Tasks vs Cloud Scheduler][5]
* [Queue overload][6]
* [Pricing Model][7]
* [Queue configuration][8]
* [Tasks scaling][9]
* [Queue quotas][10]

[1]: https://chat.openai.com/chat
[2]: https://cloud.google.com/tasks/docs/dual-overview
[3]: https://cloud.google.com/tasks/docs/dual-overview#http
[4]: https://cloud.google.com/tasks/docs/comp-pub-sub#detailed-feature-comparison
[5]: https://cloud.google.com/tasks/docs/comp-tasks-sched
[6]: https://cloud.google.com/tasks/docs/manage-cloud-task-scaling#queue
[7]: https://cloud.google.com/tasks/pricing
[8]: https://cloud.google.com/tasks/docs/configuring-queues#rate
[9]: https://cloud.google.com/tasks/docs/manage-cloud-task-scaling
[10]: https://cloud.google.com/tasks/docs/quotas

----
