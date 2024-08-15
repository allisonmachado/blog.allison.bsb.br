---
title: "Practical Design Patterns"
date: "2024-08-15"
---

# Table of Contents

# Introduction :bulb:

This is a simple an non exhaustive list of the most frequently used design patterns I had the chance to spot on real world applications over the years. :penguin:

----


## Strategy Pattern :bar_chart:

Used when it's desirable to change a concrete functionality implementation by changing the app configuration.

Imagine you are developing a [traditional chatbot][1] that needs to understand language to route it's conversation branching. The system that can understand language (NLU) can be implemented by different providers (google, ibm-watson, azure). Therefore, your code should wrap those concrete implementations into an application interface allowing developers to change the provider without changing the client logic.

## Inversion of Control :arrows_clockwise:

This design principle is used to reduce the coupling between components in a system. Instead of a class or module creating and managing its dependencies, they rely on those being injected - often by requesting interfaces. The responsibility of managing dependencies is given to an external entity, like a framework or container. This pattern makes it notoriously easier to write unit tests.

Several frameworks are well-known for their [robust implementation of Inversion of Control (IoC)][2] and some relevant examples are the Java Spring and JS Angular.

## Template Method :memo:

The Template Method pattern defines the **skeleton of an algorithm** in a superclass, but allows subclasses to override specific steps of the algorithm without changing its structure.

Imagine you are building a learning application, that organizes it's courses into learning sections, which are [Entities][3] saved in a database. Those share some basic characteristics and functionality, like common properties and being part of a hierarchical structure, which are defined in the base abstract class and methods. However, specific rules, like how many children or question each step should hold, are implemented by the [subclasses][4].

## Chain of Responsibility :two_men_holding_hands:

This design pattern allows a request to be passed along a chain of handlers. Each handler in the chain decides whether to process the request, enrich it and/or pass it to the next handler. 

This is commonly supported by most [modern back end frameworks][5], making it easy to define functions that filter data or apply some pre-processing logic that may be required by down stream processes.

## Singleton Pattern :one:

The **Singleton** design pattern is a creational pattern that ensures a class has only one instance and provides a global point of access to that instance. This is useful when exactly one object is needed to coordinate actions across a system, such as a [connection pool][6] manager or a logging service.


----

# References :books:

* [Bot Framework][1]
* [Angular Dependency Injection][2]
* [TypeORM Entities][3]
* [Entity Inheritance][4]
* [Hapi pre-handler][5]
* [Knex Singleton][6]


[1]: https://dev.botframework.com/
[2]: https://dev.to/abuhasib/software-design-principle-inversion-of-controlioc-and-dependency-injection-5e5l
[3]: https://typeorm.io/entities
[4]: https://typeorm.io/entities#entity-inheritance
[5]: https://hapi.dev/api/?v=21.3.3#-routeoptionspre
[6]: https://stackoverflow.com/a/49590925

----
