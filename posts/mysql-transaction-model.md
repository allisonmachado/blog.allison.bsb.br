---
title: "MySQL Transaction Model"
date: "2023-01-27"
---

## Introduction

To have a good understanding of the MySQL Transaction Model some fundamental concepts related to this topic should be mastered in sequence:

- Databases Read Phenomena
- Transactions Serializability
- Locking Mechanism
- The `autocommit` setting
- Transaction isolation
- Locking Reads

Transactions control data manipulation statement(s) to ensure they are [Atomic, Consistent, Isolated and Durable][2]. The way to signal the completion of a transaction to the database is by using either a [COMMIT or ROLLBACK][3] statement. A <u>COMMIT</u> statement means that the changes made in the current transaction are made permanent and become visible to other sessions. A <u>ROLLBACK</u> statement, on the other hand, cancels all modifications made by the current transaction. Transactions are implemented by the Database Storage Engine, and in this article all concepts apply for the [InnoDB Engine][1].

There is a distinction between how DML and DDL statements relate to transactions. Data Manipulation Language statements like INSERT, UPDATE, and DELETE (and SELECT ... FOR UPDATE) operate in the context of a transaction, so their effects can be committed or rolled back as a single unit. On the opposite site, Data Definition Language (DDL) statements like CREATE, ALTER, DROP, and TRUNCATE automatically commit inside the transaction; they cannot be rolled back. 

#### Databases Read Phenomena 

In a multi-tenant environment, several transactions may be executing at the same time and accessing the database rows. If the transactions are not properly isolated from one another, they can interfere with each other and cause read phenomena that may affect the understanding or even the correctness of the retrieved data. Databases can experience several types of read phenomena, including:

> **Dirty read**: An operation that retrieves unreliable data, which was updated by another transaction but not yet committed. The problem is that the read data could be rolled back, or updated further before being committed; then, the transaction doing the dirty read would be using data that was never confirmed as permanent.

> **Non-repeatable read**: The situation when a query retrieves data, and a later query within the same transaction retrieves what should be the same data, but the queries return different results (changed by another transaction committing in the meantime). This constitutes a problem because data should be consistent, with predictable and stable relationships within the same transaction ([ACID compliant][2]).

> **Phantom read**: Similar to the situation above, but in this case, a row may appear in the result set of a query but not in the result set of an earlier query of the same transaction. For example, when a query runs twice within a transaction, and in the meantime, another transaction commits inserting a new row that matches the query WHERE clause. This scenario also constitutes a problem because data should be consistent, with predictable and stable relationships within the same transaction ([ACID compliant][2]).

#### Transactions Serializability

Serializability refers to the property that ensures that concurrent execution of transactions that write to the same data result in a state that would be obtained if the transactions were executed serially, in order. This imply that transactions may wait for each other to complete - in order to ensure serializability - through the use of locking mechanisms described in this article.

Transactions that access and modify the same resources (database rows) could lead to incorrect results if not made serializable. Consider the following application function that interacts with the database:

```python
def transfer_funds(conn, source_account, destination_account, amount):
    cursor = conn.cursor()
    cursor.execute("SELECT balance FROM accounts WHERE account_id=%s", (source_account,))
    balance = cursor.fetchone()[0]
    if balance >= amount:
        cursor.execute("UPDATE accounts SET balance = balance - %s WHERE account_id=%s", (amount, source_account))
        cursor.execute("UPDATE accounts SET balance = balance + %s WHERE account_id=%s", (amount, destination_account))
    conn.commit()
```

Suppose in the database there are two accounts, A and B, each with a balance of \$100. Two processes T1 and T2 are executed concurrently, each trying to transfer \$100 from account A to account B. If these processes are not executed in a serializable manner, the potential scenario could happen:

1. T1 reads the balance of A (\$100)
2. T2 reads the balance of A (\$100)
3. T1 subtracts \$100 from A and adds \$100 to B, making the balances A (\$0) and B (\$200)
4. T2 subtracts \$100 from A and adds \$100 to B, making the balances A (\$-100) and B (\$300)

In this scenario, both processes have executed concurrently, interpreting the balance incorrectly, leading to an incorrect final state of the system, where the balance in account A is negative and the total balance of B is $300. To avoid this, serializability would require that one of the transactions wait for the other to complete before executing.

#### Locking Mechanism

Let's first stablish the definition of an **explicit locking read**. In this article, an explicit locking read is a [SELECT statement with <u>FOR UPDATE</u> or <u>LOCK IN SHARE MODE</u> at the end][4]. If you use FOR UPDATE, it reads the latest available data, setting exclusive locks on each row it reads.Using LOCK IN SHARE MODE sets a shared lock that permits other transactions to read the examined rows but not to update or delete them.

MySQL implements data [row locking][5] in the form of shared (S) locks and exclusive (X) locks. Locks grant permission to operate on row data - if a transaction holds a shared lock it can read the row. If a transaction holds an exclusive row lock, it can write to the row.

The fundamental types of locks are:

- Shared (S)
- Exclusive (X)
- Intension Shared (IS)
- Intension Exclusive (IX)

Intention locks indicate which type of lock (shared or exclusive) a transaction requires later for a row in a table:

> Before a transaction can acquire a (S) lock on a row in a table, it must first acquire an (IS) lock on the table.

> Before a transaction can acquire an (X) on a row in a table, it must first acquire an (IX) lock on the table.

A lock is granted to a requesting transaction if it is compatible with existing locks, but not if it conflicts with existing locks already acquired. A transaction waits until the acquired existing lock is released. The following table summarizes the conditions for conflict acquisition:

|        | X        | IX         | S          | IS         |
|--------|----------|------------|------------|------------|
| **X**  | Conflict | Conflict   | Conflict   | Conflict   |
| **IX** | Conflict | Compatible | Conflict   | Compatible |
| **S**  | Conflict | Conflict   | Compatible | Compatible |
| **IS** | Conflict | Compatible | Compatible | Compatible |

An example of a transaction trying to acquire a lock is the following:

If transaction `T1` holds a shared (S) lock on row r, then requests from some distinct transaction `T2` for a lock on row r are handled as follows:

> A request by `T2` for an (S) lock can be granted immediately. As a result, both `T1` and `T2` hold an (S) lock on r.

> A request by `T2` for an (X) lock cannot be granted immediately.

If a transaction `T1` holds an exclusive (X) lock on row r, a request from some distinct transaction `T2` for a lock of either type on r cannot be granted immediately. Instead, transaction `T2` has to wait for transaction T1 to release its lock on row r.

Depending on how the locks are assigned to rows, they can be called by specific names. For example, locks placed on individual records in a table are called `Record Locks`. Locks that are placed on a range of rows between two index records, used to prevent other transactions from inserting new records into the range are called `Gap Locks` or `Next-key Locks`. Finally to maintain the integrity of the data and ensure there is no issue while inserting new data, the `Insert-Intention Lock` and `Auto-Inc Locks` are used by INSERT operations.

###### RECORD LOCKS

Individual row locks are called record locks. For example, `SELECT c1 FROM t WHERE c1 = 10 FOR UPDATE;` prevents any other transaction from inserting, updating, or deleting rows where the value of t.c1 is 10. 

###### GAP LOCKS

On the opposite, a gap-lock is a lock on a range between records from a query that defines a conditional range filter. For example, SELECT c1 FROM t WHERE c1 BETWEEN 10 and 20 FOR UPDATE prevents other transactions from inserting a value of 12 or 18 into column t.c1 - creating a gap-lock between rows that have c1 among 10 and 20.

A gap-lock taken by one transaction does not prevent another transaction from taking a gap-lock on the same range.  Gap locks can co-exist - they are “purely inhibitive”, which means that their only purpose is to prevent other transactions from inserting to the gap. 

###### NEXT-KEY LOCKS

A next-key lock is a combination of a record lock and a gap lock on the gap before the index record.

The difference between a MySQL next-key lock and a gap lock is that a next-key lock covers both a specific record and the gap before it, while a gap lock only covers the gap between two index records.

###### INSERT-INTENTION LOCKS

The Insert Intention Lock signals the plan to insert new data into a table or row. Multiple transactions can insert into the same index range without waiting for each other if they insert at different positions within the range, otherwise they prevent other transactions from modifying or inserting new rows until the lock is released.

###### AUTO-INC LOCKS

An AUTO-INC lock is a lock placed on a table with AUTO_INCREMENT columns during inserts. If one transaction is inserting, any other transactions must wait until it's done, to ensure that each new row gets consecutive primary key values.

#### The `autocommit` setting

If `autocommit` mode is enabled, each SQL statement forms a single transaction on its own. By default, MySQL starts the session for each new connection with `autocommit` enabled, so MySQL does a commit after each SQL statement if that statement did not return an error. A session that has `autocommit` enabled can perform a multiple-statement transaction by starting it with an explicit `START TRANSACTION` or `BEGIN` statement and ending it with a `COMMIT` or `ROLLBACK` statement.

This feature is frequently used for cases where sql scripts need to be executed in production environments. In those cases, `autocommit` is disabled, so all DML statements do not take effect immediately. Using MySQL Workbench as a client, one can disable autocommit in the menu options. If autocommit mode is disabled within a session, the session always has a transaction open. A COMMIT or ROLLBACK statement ends the current transaction and a new one starts. If a session that has autocommit disabled ends without explicitly committing the final transaction, MySQL rolls back that transaction.

In summary:

> To use multiple-statement transactions, switch autocommit off with the SQL statement SET autocommit = 0, then end each transaction with COMMIT or ROLLBACK as appropriate.

> To leave autocommit on, begin each transaction with START TRANSACTION and end it with COMMIT or ROLLBACK. Both `COMMIT` and `ROLLBACK` release all locks that were set during the current transaction.

#### Transaction isolation

In combination with locks, MySQL uses the [concept of consistent non-locking reads][9] to provide isolation between transactions: it allows multiple transactions to view consistent data by creating multiple versions of the data for each transaction. This involves maintaining multiple versions of each row in a table and keeping track of which version of a row is visible to each transaction. It prevents the need for locks, but it also requires additional memory and processing logic to maintain the multiple versions of the data.

Considering that concurrent processing takes a hit when transactions need to wait for one another for acquiring locks - transaction isolation is the setting that fine-tunes the balance between performance and consistency of results when multiple transactions are making changes and performing queries at the same time. 

The Databases Read Phenomena can be avoided or minimized by using the appropriate isolation level and locking mechanisms in the database management system.

> To avoid Dirty read: avoid using the isolation level known as <u>READ COMMITTED</u>.

> To avoid Non-repeatable read: use the <u>SERIALIZABLE</u> or <u>REPEATABLE READ</u> isolation levels.

> To avoid Phantom reads use: <u>SERIALIZABLE</u> isolation level.

The isolation level that uses the most conservative locking strategy is <u>SERIALIZABLE</u>. It prevents any other transactions from inserting or changing data that was read by this transaction, until it is finished. Any attempt to change data that was committed by another transaction since the start of the current transaction, cause the current transaction to fail.

The image bellow, taken from [this video][6], helps to summarize which read phenomena can happen under which isolation level:

![MySQL Isolation Levels](/images/posts/mysql-isolation-levels.png 'MySQL Isolation Levels')

One thing to keep in mind is - the consistent non-locking read (multi-versioning to present to a query a snapshot of the database at a point in time) is the default mode in which MySQL processes SELECT statements in READ COMMITTED and REPEATABLE READ isolation levels. A consistent read does not set any locks on the tables it accesses, and therefore other sessions are free to modify those tables at the same time a consistent read is being performed on the table. 

###### READ UNCOMMITTED

Under this isolation level, SELECT statements are performed in a nonlocking fashion, however such reads are not consistent. This looseness allows dirty reads.

###### READ COMMITTED

This isolation level provides *Consistent Nonlocking Reads*, for simple SELECT statements, which means that MySQL internally uses multi-versioning to present a snapshot of the database at a point in time for a query. The query sees the changes made by transactions that committed before that point in time, and no changes made by later or uncommitted transactions - avoiding a dirty read.

However, each consistent read, even within the same transaction, sets and reads its own fresh snapshot. Therefore, it does not prevent the non-repeatable read phenomena.

For explicit locking reads, UPDATE statements, and DELETE statements, MySQL only locks index records, not the gaps before them, and thus permits the free insertion of new records next to locked records, allowing phantom reads to happen (Gap locking is disabled in the transaction isolation level READ COMMITTED).

###### REPEATABLE READ

This isolation level also provides *Consistent Nonlocking Reads*, for simple SELECT statements, but with one level of strictness higher than <u>READ COMMITTED</u> - which means that consistent reads within the same transaction **read the snapshot established by the first read** of the transaction. It means it's not only avoiding dirty-reads but also the non-repeatable read phenomena.

![Consistent Nonlocking Reads](images/posts/consistent-nonlocking-reads.png 'Consistent Nonlocking Reads')
*Repeatable Read Isolation Level*

For explicit locking reads, UPDATE, and DELETE statements, locking depends on whether the statement uses a unique index with a unique search condition or a range-type search condition. For the former MySQL locks only the index record found, for the latter it locks the index range scanned, using gap locks or next-key locks to block insertions by other sessions into the gaps covered by the range.

By default, MySQL operates in REPEATABLE READ transaction isolation level. In this case, MySQL uses next-key locks for searches and index scans, which prevents phantom rows.

###### SERIALIZABLE

As described above being the most strict isolation level, used mostly for specific use cases due to the performance impact on reads, this is similar to <u>REPEATABLE READ</u>, but MySQL implicitly converts all plain SELECT statements to **SELECT ... LOCK IN SHARE MODE**. This isolation level has the ability to prevent the transactions Serialization Anomaly - it's a situation in a database where multiple transactions executing concurrently may produce unexpected or incorrect results because the order in which operations are executed affects the outcome.

#### Locking Reads

According to the mysql docs: *"If you query data and then insert or update related data within the same transaction, the regular SELECT statement does not give enough protection. Other transactions can update or delete the same rows you just queried"*.

Note that *"Locking reads are only possible when autocommit is disabled (either by beginning transaction with START TRANSACTION or by setting autocommit to 0.)"*

###### SELECT ... LOCK IN SHARE MODE

Sets a shared lock on any rows that are read - hence other sessions can read the rows, but cannot modify them until your transaction commits. If the queried data is being modified by an unfinished transaction, your query waits until that transaction ends and then uses the latest values (because shared locks need to wait the release of exclusive locks). This behavior is illustrated in the following diagram:

![SELECT ... LOCK IN SHARE MODE](images/posts/select-lock-in-share-mode.png 'SELECT ... LOCK IN SHARE MODE')
*Repeatable Read Isolation Level*

###### SELECT ... FOR UPDATE

This locks the queried records with an exclusive write lock until the transaction is completed (committed or rolled back): *"other transactions are blocked from updating those rows, from doing SELECT ... LOCK IN SHARE MODE, or from doing SELECT ... FOR UPDATE"*.

![SELECT ... FOR UPDATE](images/posts/select-for-update.png 'SELECT ... FOR UPDATE')
*Repeatable Read Isolation Level*

###### CONCURRENCY VS CONSISTENCY

Both Locking Read methods described are commonly used to [prevent lost updates and write skews][8] - they minimize concurrency for the sake of data consistency and avoid double booking like problems. However it's important to keep in mind that both methods make the transactions behave differently. For example, if two transactions attempt to update the same row at the same time, the first transaction that executes the SELECT FOR UPDATE statement will acquire a lock on the row and the second transaction will be blocked until the first transaction releases the lock. However, if two transactions attempt to update the same row at the same time and both use SELECT IN SHARE MODE, both transactions will be able to read the row and obtain a shared lock, but the first transaction that tries to update the row will succeed and the second transaction will fail with an error. This situation is illustrated in the images bellow:

![CONSISTENT FOR UPDATE](images/posts/consistent-for-update.png 'CONSISTENT FOR UPDATE')
*Repeatable Read Isolation Level*

![CONSISTENT LOCK IN SHARE MODE](images/posts/consistent-lock-in-share-mode.png 'CONSISTENT LOCK IN SHARE MODE')
*Repeatable Read Isolation Level*

When using the SELECT ... LOCK IN SHARE MODE (or the SERIALIZABLE isolation level), transactions can be more prone to deadlock, which occurs when two or more transactions are waiting for each other to release locks. To deal with this situation, it is important to make your application able to handle deadlock exceptions - you can retry the transaction, or try again with a different set of data.

## References

* [MySQL - InnoDB Locking and Transaction Model][1]
* [Prisma Data Guide - ACID][2]
* [Digital Ocean - SQL Commit And Rollback][3]
* [Stack Overflow - Explicit Locking Read][4]
* [Stack Overflow - Locking Mechanisms][5]
* [YouTube - MySQL Isolation Levels][6]
* [Stack Overflow - Lost update vs Write skew][7]
* [Stack Overflow - Database Integrity][8]
* [Kleppmann, M. (2017). Snapshot isolation and repeatable read. In Designing Data-Intensive Applications. Sebastopol, CA: O'Reilly Media, Inc.][9]

[1]: https://dev.mysql.com/doc/refman/5.7/en/innodb-locking-transaction-model.html
[2]: https://www.prisma.io/dataguide/intro/database-glossary#acid
[3]: https://www.digitalocean.com/community/tutorials/sql-commit-sql-rollback
[4]: https://stackoverflow.com/questions/32827650/mysql-innodb-difference-between-for-update-and-lock-in-share-mode?rq=1
[5]: https://stackoverflow.com/questions/129329/optimistic-vs-pessimistic-locking?rq=1
[6]: https://www.youtube.com/watch?v=4EajrPgJAk0
[7]: https://stackoverflow.com/a/53960539/5874427
[8]: https://stackoverflow.com/questions/40749730/how-to-properly-use-transactions-and-locks-to-ensure-database-integrity
[9]: https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/

## TODO

- Work on the following:
2. https://dev.mysql.com/doc/refman/5.7/en/innodb-locks-set.html