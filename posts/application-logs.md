---
title: "Application Logging"
date: "2022-03-12"
---

# Table of Contents

# Introduction :building_construction:


> *"Logging is a means of tracking events that happen when some software runs. The software’s developer should reason about logging calls to improve software monitoring"* :pencil:

A Developer should work in a software always thinking about it's observability, since the first course of action when troubleshooting any problem usually involves looking at the produced logs.

Logs should inform about the execution and lifecycle of our application in a way that we can find the desired execution step as fast as possible. Therefore, we need to reason about some aspects of our logs to make them good:

* Frequency
* Aggregated Values
* Criticality Level
* Structured Logging

## Frequency :stopwatch:

Too much information can be equivalent to no information. Therefore, it does not make sense to either not send logs or log each and every step of our app. When talking about new implementations, maybe it makes sense to start writing more log statements than usual and, as the feature proves to be stable, some logs could be revisited and updated to have a less important Criticality Levels. As time passes, a good portion of them could even deleted to avoid excessive logging.

## Aggregated Values :bucket:

At the same time, think about yourself inspecting the log records in the future and trying to figure out what’s happening. Writing too much aggregated data (runtime variables) to the log records could make it difficult to read and understand them. For example, logging the whole set of variables involved in an operation may not always be the best idea.

## Criticality Level :bar_chart:

Log levels should be used to indicate the urgency to which such message should be taken into consideration. For example, consider the following Levels:

* `Error` - This level could indicate an execution or configuration problem that may lead the app to unresponsiveness. For example, when the system cannot connect to the database, or when some exception was not handled/foreseen by the developer.
* `Warn` - This level could indicate that an external integration misbehaved in a way that could lead to some unexpected results in our application. Another usage is for when some event may require attention or an indicative of some problem in the near future (e.g. ‘disk space low’)
* `Info` - This level could be used to increase visibility in a regular but important application action. For example, if some administrator deletes a account, or when a new user is created. This could serve as the foundation for custom defined monitoring metrics.
* `Debug` - This level could be used to increase log verbosity for a new implementation under stability phase. In the days that immediately succeed a brand new deployment, this could be very important for troubleshooting :bug:. And again - as time passes, a good portion of them could even be deleted to avoid excessive logging.
* `Trace` - In an ideal world this should be the logs reserved for external added libraries and dependencies.

Keep in mind that Criticality Levels could play a big role in reducing the frequency of inspected logs. We may instruct a log analysis tools to only display logs above a specific Criticality Level (or instruct the backend library to only send logs above a specific Criticality Level).

## Structured Logging :musical_keyboard:
Since log libraries and log analysts tools are very flexible, we may fall into the trap of not having a common way of writing log calls. This makes logs to be saved in a multitude of formats which ultimately lead to multiple different ways of querying and inspecting them. 

Considering that it is much easier to look at logs when they have a predictable structure over time, the developers working in a project should introduce a tiny wrapper on top of a logging library that enforces a structure while writing the logs (or install a log library that already support this idea).


# References :books:

* [Python Logging Tutorial](https://docs.python.org/3.8/howto/logging.html#logging-basic-tutorial)
* [12 Factor App - Logs](https://12factor.net/logs)
* [Lambda structured logging](https://docs.aws.amazon.com/lambda/latest/operatorguide/parse-logs.html)
