---
title: "Application Logging"
date: "2022-03-12"
---

### Log Fundamentals


***"Logging is a means of tracking events that happen when some software runs. The software’s developer adds logging calls to their code to indicate that certain events have occurred"***

A Developer should work in a software always thinking in observability, since the first course of action when troubleshooting any problem usually involves looking at the produced logs.

Logs should inform about the execution and lifecycle of our application in a way that we can find the desired execution step as fast as possible. Therefore, we need to think about some aspects of our logs like:

* Frequency
* Aggregated Values
* Criticality Level
* Structured Logging

###### Frequency

Too much information can be equivalent to no information. Therefore, it does not make sense to either not send logs or log each and every step of our app. When talking about new implementations, maybe it makes sense to start writing more log statements than usual and, as the feature proves to be stable, some logs could be revisited and updated to have a less important Criticality Levels. As time passes, a good portion of them could even deleted to avoid excessive logging.

###### Aggregated Values

At the same time, think about yourself inspecting the log records in the future and trying to figure out what’s happening. Writing too much aggregated data and variables to the log record could make it difficult to read and understand. For example, logging the whole set of variables involved in an operation may not always be the best idea.

###### Criticality Level

Log levels should be used to indicate the urgency to which such message should be taken into consideration. For example, consider the following Levels:

* Error - This level could indicate an execution or configuration problem that may lead the app to unresponsiveness. For example, when the system cannot connect to the database, or when some exception was not handled/foreseen by the developer.
* Warn - This level could indicate that an external piece of software in an integration misbehaved in a way that could lead to some unexpected results in our application. Another usage is for when some event may require attention or an indicative of some problem in the near future (e.g. ‘disk space low’)
* Info - This level could be used to increase visibility in a regular but important application action. For example, if some administrator deletes a account, or when a new user is created. This could serve as the foundation for custom defined monitoring metrics.
* Debug - This level could be used to increase the app log verbosity for a new implementation under stability phase. In the days that immediately succeed a brand new deployment, this could be very important for bug troubleshooting. And again - as time passes, a good portion of them could even be deleted to avoid excessive logging.
* Trace - In an ideal world this should be the logs reserved for external added libraries and dependencies.

Keep in mind that Criticality Levels could play a big role in reducing the frequency of inspected logs. We may instruct a log analysis tools to only display logs above a specific Criticality Level (or instruct the backend library to only send logs above a specific Criticality Level).

###### Structured Logging
Since log libraries and log analysts tools are very flexible, we may fall into the trap of not having a common way of writing log calls. This makes logs to be saved in a multitude of formats which ultimately lead to multiple different ways of querying and inspecting them. Not to mention that it is much easier to look at logs when they have a predictable structure over time. 

To mitigate this issue, the developers working in a project could introduce a tiny wrapper on top of a logging library that enforces a structure while writing the logs.


### References

* [Python Logging Tutorial](https://docs.python.org/3.8/howto/logging.html#logging-basic-tutorial)
* [12 Factor App - Logs](https://12factor.net/logs)
* [Lambda structured logging](https://docs.aws.amazon.com/lambda/latest/operatorguide/parse-logs.html)
