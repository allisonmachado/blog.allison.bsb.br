---
title: "MySQL Transaction Model"
date: "2023-01-27"
---

## Locking Basics

MySQL implements data row locking in the form of shared (S) locks and exclusive (X) locks. Locks grant permission to operate on row data, for instance if a transaction holds a shared lock it can read the row (the same is true for exclusive locks for writing).

A lock is granted to a requesting transaction if it is compatible with existing locks, but not if it conflicts with existing locks. A transaction waits until the conflicting existing lock is released. The following table summarizes the conditions for acquiring the locks:

X	IX	S	IS
X	Conflict	Conflict	Conflict	Conflict
IX	Conflict	Compatible	Conflict	Compatible
S	Conflict	Conflict	Compatible	Compatible
IS	Conflict	Compatible	Compatible	Compatible

An example of a transaction trying to acquire a lock is the following:

If transaction T1 holds a shared (S) lock on row r, then requests from some distinct transaction T2 for a lock on row r are handled as follows:

- A request by T2 for an S lock can be granted immediately. As a result, both T1 and T2 hold an S lock on r.

- A request by T2 for an X lock cannot be granted immediately.

If a transaction T1 holds an exclusive (X) lock on row r, a request from some distinct transaction T2 for a lock of either type on r cannot be granted immediately. Instead, transaction T2 has to wait for transaction T1 to release its lock on row r.

Another type of lock is a gap lock, which is a lock on a range between records from a query that defines a conditional range filter. For example, SELECT c1 FROM t WHERE c1 BETWEEN 10 and 20 FOR UPDATE prevents other transactions from inserting a value of 12 or 18 into column t.c1 - creating a gap log between rows that have c1 among 10 and 20.

A gap lock taken by one transaction does not prevent another transaction from taking a gap lock on the same gap.  Gap locks can co-exist - they are “purely inhibitive”, which means that their only purpose is to prevent other transactions from inserting to the gap. Therefore, there is no difference between shared and exclusive gap locks and they do not conflict with each other

## References

* [InnoDB Locking and Transaction Model][1]

[1]: https://dev.mysql.com/doc/refman/5.7/en/innodb-locking-transaction-model.html

