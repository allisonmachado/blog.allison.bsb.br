---
title: "MySQL Transaction Model"
date: "2023-01-27"
---

## Introduction

To have a good understanding of the MySQL Transaction Model, a few fundamental concepts related to this topic should be mastered first:

- Databases Read Phenomena
- Locking Mechanism
- The `autocommit` setting
- Transaction isolation 

Transactions control data manipulation statement(s) to ensure they are Atomic, Consistent, Isolated and Durable. The way to signal the completion of the transaction to the database is by using either a COMMIT or ROLLBACK statement.  An COMMIT statement means that the changes made in the current transaction are made permanent and become visible to other sessions. A ROLLBACK statement, on the other hand, cancels all modifications made by the current transaction.

Transactions are implemented by the Database Storage Engine, and in this article all concepts apply for the InnoDB Engine.

#### Databases Read Phenomena 

In a multi-tenant environment, multiple transactions may be executing at the same time and accessing the database rows. If these transactions are not properly isolated from one another, they can interfere with each other and cause read phenomena that may affect the understanding or even the correctness of the retrieved data. Databases can experience several types of read phenomena, including:

- **Dirty read**: An operation that retrieves unreliable data, data that was updated by another transaction but not yet committed. The problem is that the read data could be rolled back, or updated further before being committed; then, the transaction doing the dirty read would be using what was never confirmed as accurate.

- **Non-repeatable read**: The situation when a query retrieves data, and a later query within the same transaction retrieves what should be the same data, but the queries return different results (changed by another transaction committing in the meantime). This constitutes a problem because data should be consistent, with predictable and stable relationships within the same transaction (ACID compliant).

- **Phantom read**: Similar to the situation above, but in this case a row may appear in the result set of a query, but not in the result set of an earlier query. For example, if a query is run twice within a transaction, and in the meantime, another transaction commits inserting a new row that matches the WHERE clause of the query. Again this constitutes a problem because data should be predictable within the same transaction (ACID compliant).

These phenomena can be avoided or minimized by using the appropriate isolation level and locking mechanisms in the database management system.

- To avoid Dirty read use: avoid using the isolation level known as <u>READ UNCOMMITTED</u>.

- To avoid Non-repeatable read: use the <u>SERIALIZABLE READ</u> <u>REPEATABLE READ</u> levels.

- To avoid Phantom read use: <u>SERIALIZABLE READ</u> isolation level.

#### Locking Mechanism

MySQL implements data row locking in the form of shared (S) locks and exclusive (X) locks. Locks grant permission to operate on row data, for instance if a transaction holds a shared lock it can read the row. If a transaction holds an exclusive row lock, it can write to the row.

There are four types of locks:

- Shared (S)
- Exclusive (X)
- Intension Shared (IS)
- Intension Exclusive (IX)

Intention locks indicate which type of lock (shared or exclusive) a transaction requires later for a row in a table, they show someone is locking a row, or is going to lock a row in the table:

- Before a transaction can acquire a shared lock on a row in a table, it must first acquire an IS lock or stronger on the table.

- Before a transaction can acquire an exclusive lock on a row in a table, it must first acquire an IX lock on the table.

A lock is granted to a requesting transaction if it is compatible with existing locks, but not if it conflicts with existing locks. A transaction waits until the conflicting existing lock is released. The following table summarizes the conditions for conflict acquisition:

|        | X        | IS         | S          | IS         |
|--------|----------|------------|------------|------------|
| **X**  | Conflict | Conflict   | Conflict   | Conflict   |
| **IS** | Conflict | Compatible | Conflict   | Compatible |
| **S**  | Conflict | Conflict   | Compatible | Compatible |
| **IS** | Conflict | Compatible | Compatible | Compatible |

An example of a transaction trying to acquire a lock is the following:

If transaction `T1` holds a shared (S) lock on row r, then requests from some distinct transaction `T2` for a lock on row r are handled as follows:

- A request by `T2` for an (S) lock can be granted immediately. As a result, both `T1` and `T2` hold an (S) lock on r.

- A request by `T2` for an (X) lock cannot be granted immediately.

If a transaction `T1` holds an exclusive (X) lock on row r, a request from some distinct transaction `T2` for a lock of either type on r cannot be granted immediately. Instead, transaction `T2` has to wait for transaction T1 to release its lock on row r.

Individual row locks are called record locks. For example, SELECT c1 FROM t WHERE c1 = 10 FOR UPDATE; prevents any other transaction from inserting, updating, or deleting rows where the value of t.c1 is 10. On the opposite, a gap-lock is a lock on a range between records from a query that defines a conditional range filter. For example, SELECT c1 FROM t WHERE c1 BETWEEN 10 and 20 FOR UPDATE prevents other transactions from inserting a value of 12 or 18 into column t.c1 - creating a gap-lock between rows that have c1 among 10 and 20.

A gap-lock taken by one transaction does not prevent another transaction from taking a gap-lock on the same range.  Gap locks can co-exist - they are “purely inhibitive”, which means that their only purpose is to prevent other transactions from inserting to the gap. Therefore, there is no difference between shared and exclusive gap locks and they do not conflict with each other.

- TODO: define *Insert Intention Locks* and *Next-Key Locks* 

#### The `autocommit` setting

By default all user activity occurs inside a transaction. If `autocommit` mode is enabled, each SQL statement forms a single transaction on its own. By default, MySQL starts the session for each new connection with `autocommit` enabled, so MySQL does a commit after each SQL statement if that statement did not return an error. A session that has `autocommit` enabled can perform a multiple-statement transaction by starting it with an explicit START TRANSACTION or BEGIN statement and ending it with a COMMIT or ROLLBACK statement. Both COMMIT and ROLLBACK release all locks that were set during the current transaction.

This feature is frequently used for cases where sql scripts need to be executed in production environments. In those cases, `autocommit` is disabled, so all changes to a table do not take effect immediately. Using MySQL Workbench as a client, one can disable autocommit in the menu options. From that point onwards, all sql statements are inside a fresh new transaction. As soon as whe finish running all sql statements one can either COMMIT or ROLLBACK (options also available in the menu).

#### Transaction isolation

Transaction isolation the setting that fine-tunes the balance between performance and reliability, consistency, and reproducibility of results when multiple transactions are making changes and performing queries at the same time.

- TODO: write this section

## References

* [InnoDB Locking and Transaction Model][1]

[1]: https://dev.mysql.com/doc/refman/5.7/en/innodb-locking-transaction-model.html

