# MySQL Syntax Guide

This document provides a detailed guide to MySQL syntax, focusing on commands, clauses, functions, and practical examples. Each example includes the expected output and an explanation of why the result occurs. MySQL is a widely used relational database management system, and this guide adheres to its specific syntax and features.

## Sample Database Schema
For the examples, we’ll use the following schema:

- **employees**:
  - `id` (INT, Primary Key)
  - `name` (VARCHAR(50))
  - `salary` (DECIMAL(10,2))
  - `dept_id` (INT, Foreign Key)
  - `hire_date` (DATE)

- **departments**:
  - `dept_id` (INT, Primary Key)
  - `dept_name` (VARCHAR(50))

### Initial Data Setup
Let’s populate the tables with some data to use in examples:

```sql
-- Create and populate departments
CREATE TABLE departments (
    dept_id INT PRIMARY KEY,
    dept_name VARCHAR(50)
);

INSERT INTO departments (dept_id, dept_name) VALUES
(1, 'Engineering'),
(2, 'Marketing'),
(3, 'HR');

-- Create and populate employees
CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    salary DECIMAL(10,2),
    dept_id INT,
    hire_date DATE,
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

INSERT INTO employees (id, name, salary, dept_id, hire_date) VALUES
(1, 'Alice Smith', 75000.00, 1, '2023-01-15'),
(2, 'Bob Jones', 82000.00, 1, '2023-02-20'),
(3, 'Charlie Brown', 65000.00, 2, '2023-03-10'),
(4, 'Diana Prince', 90000.00, NULL, '2023-04-01'),
(5, 'Eve Adams', 70000.00, 3, '2023-05-15');
```

## 1. Data Definition Language (DDL)
DDL commands define and modify the structure of database objects.

### CREATE
#### CREATE DATABASE
```sql
CREATE DATABASE company_db;
```
- **Result**: A new database named `company_db` is created.
- **Why**: The `CREATE DATABASE` command initializes a new database where tables and data can be stored. You’d need to use `USE company_db;` to switch to this database before creating tables.

#### CREATE TABLE
```sql
CREATE TABLE projects (
    project_id INT PRIMARY KEY AUTO_INCREMENT,
    project_name VARCHAR(100) NOT NULL,
    dept_id INT,
    start_date DATE,
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);
```
- **Result**: A new table `projects` is created with an auto-incrementing primary key, a mandatory project name, and a foreign key to `departments`.
- **Why**: `AUTO_INCREMENT` automatically generates unique `project_id` values. The `FOREIGN KEY` ensures `dept_id` values must exist in the `departments` table, enforcing referential integrity.

#### CREATE INDEX
```sql
CREATE INDEX idx_emp_salary ON employees(salary);
```
- **Result**: An index named `idx_emp_salary` is created on the `salary` column.
- **Why**: Indexes improve query performance for operations like sorting or filtering on `salary`, e.g., `SELECT * FROM employees WHERE salary > 80000;`. Without an index, MySQL would scan the entire table; with an index, it can quickly locate relevant rows.

### ALTER
#### ALTER TABLE - Add Column
```sql
ALTER TABLE employees ADD COLUMN email VARCHAR(100);
```
- **Result**: A new `email` column is added to the `employees` table, with `NULL` values for existing rows.
- **Why**: This allows adding new attributes to an existing table without affecting current data. Since no default value is specified, MySQL sets the column to `NULL` for all rows.

#### ALTER TABLE - Modify Column
```sql
ALTER TABLE employees MODIFY COLUMN salary DECIMAL(12,2);
```
- **Result**: The `salary` column’s data type changes to `DECIMAL(12,2)`, allowing larger values.
- **Why**: This is useful when the original column size (e.g., `DECIMAL(10,2)`) is too small for new data. Existing values are preserved as long as they fit the new type.

#### ALTER TABLE - Drop Column
```sql
ALTER TABLE employees DROP COLUMN email;
```
- **Result**: The `email` column is removed from the `employees` table.
- **Why**: This removes unnecessary columns, freeing up space and simplifying the table structure. Any data in the `email` column is permanently deleted.

### DROP
#### DROP TABLE
```sql
DROP TABLE projects;
```
- **Result**: The `projects` table is deleted, including all its data and structure.
- **Why**: This is used to remove tables that are no longer needed. Be cautious, as this action is irreversible and deletes all associated data.

#### DROP DATABASE
```sql
DROP DATABASE company_db;
```
- **Result**: The `company_db` database and all its tables are deleted.
- **Why**: This removes the entire database, useful for cleanup or starting fresh. Ensure you back up important data first, as this is a destructive operation.

#### DROP INDEX
```sql
DROP INDEX idx_emp_salary ON employees;
```
- **Result**: The `idx_emp_salary` index is removed.
- **Why**: Indexes consume storage and slow down write operations (INSERT/UPDATE). Dropping an unused index can improve performance for write-heavy workloads.

### TRUNCATE
```sql
TRUNCATE TABLE departments;
```
- **Result**: All rows in `departments` are deleted, but the table structure remains. This will fail if `employees` has rows referencing `departments` due to the foreign key constraint.
- **Why**: `TRUNCATE` is faster than `DELETE` for removing all rows because it doesn’t log individual row deletions and resets auto-increment counters. However, foreign key constraints prevent truncation if referenced by another table.

## 2. Data Manipulation Language (DML)
DML commands manipulate data within tables.

### INSERT
#### Single Row Insert
```sql
INSERT INTO departments (dept_id, dept_name)
VALUES (4, 'Sales');
```
- **Result**:
  ```
  dept_id | dept_name
  --------+-----------
  1       | Engineering
  2       | Marketing
  3       | HR
  4       | Sales
  ```
- **Why**: The `INSERT INTO` statement adds a new row to `departments`. The `dept_id` and `dept_name` values are explicitly provided, and MySQL stores them as specified.

#### Multiple Row Insert
```sql
INSERT INTO employees (id, name, salary, dept_id, hire_date)
VALUES 
    (6, 'Frank Wilson', 68000.00, 4, '2023-06-01'),
    (7, 'Grace Lee', 72000.00, 4, '2023-07-15');
```
- **Result**:
  ```
  id | name          | salary  | dept_id | hire_date
  ---+---------------+---------+---------+------------
  1  | Alice Smith   | 75000.00| 1       | 2023-01-15
  2  | Bob Jones     | 82000.00| 1       | 2023-02-20
  3  | Charlie Brown | 65000.00| 2       | 2023-03-10
  4  | Diana Prince  | 90000.00| NULL    | 2023-04-01
  5  | Eve Adams     | 70000.00| 3       | 2023-05-15
  6  | Frank Wilson  | 68000.00| 4       | 2023-06-01
  7  | Grace Lee     | 72000.00| 4       | 2023-07-15
  ```
- **Why**: This inserts two new rows into `employees` in a single statement, which is more efficient than separate `INSERT` statements. The foreign key constraint ensures `dept_id` 4 exists in `departments`.

### SELECT
#### Basic SELECT
```sql
SELECT name, salary FROM employees;
```
- **Result**:
  ```
  name          | salary
  --------------+---------
  Alice Smith   | 75000.00
  Bob Jones     | 82000.00
  Charlie Brown | 65000.00
  Diana Prince  | 90000.00
  Eve Adams     | 70000.00
  Frank Wilson  | 68000.00
  Grace Lee     | 72000.00
  ```
- **Why**: This retrieves only the `name` and `salary` columns for all rows in `employees`. Using specific columns instead of `SELECT *` is more efficient and clearer.

#### SELECT with WHERE
```sql
SELECT * FROM employees WHERE dept_id = 1 AND salary > 80000;
```
- **Result**:
  ```
  id | name      | salary  | dept_id | hire_date
  ---+-----------+---------+---------+------------
  2  | Bob Jones | 82000.00| 1       | 2023-02-20
  ```
- **Why**: The `WHERE` clause filters rows where `dept_id` is 1 (Engineering) and `salary` exceeds 80000. Only Bob Jones meets both conditions.

#### SELECT with ORDER BY
```sql
SELECT name, salary FROM employees ORDER BY salary DESC LIMIT 3;
```
- **Result**:
  ```
  name         | salary
  -------------+---------
  Diana Prince | 90000.00
  Bob Jones    | 82000.00
  Alice Smith  | 75000.00
  ```
- **Why**: `ORDER BY salary DESC` sorts the result by salary in descending order. `LIMIT 3` restricts the output to the top 3 highest-paid employees.

#### SELECT with GROUP BY and HAVING
```sql
SELECT dept_id, AVG(salary) AS avg_salary
FROM employees
GROUP BY dept_id
HAVING AVG(salary) > 70000;
```
- **Result**:
  ```
  dept_id | avg_salary
  --------+------------
  1       |  78500.00
  4       |  70000.00
  ```
- **Why**: `GROUP BY dept_id` groups rows by department. `AVG(salary)` calculates the average salary per department. `HAVING AVG(salary) > 70000` filters groups where the average salary exceeds 70000. Department 1 (Engineering) has an average of (75000 + 82000)/2 = 78500, and Department 4 (Sales) has an average of (68000 + 72000)/2 = 70000. Department 2 and 3 are excluded due to lower averages, and `NULL` `dept_id` (Diana) isn’t grouped.

#### SELECT with JOIN
```sql
SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id
WHERE d.dept_name = 'Engineering';
```
- **Result**:
  ```
  name        | dept_name
  ------------+-----------
  Alice Smith | Engineering
  Bob Jones   | Engineering
  ```
- **Why**: `LEFT JOIN` includes all rows from `employees` and matches with `departments`. The `ON e.dept_id = d.dept_id` condition links the tables. The `WHERE d.dept_name = 'Engineering'` filters for employees in the Engineering department (dept_id 1). Diana Prince has a `NULL` `dept_id`, so she’s excluded after the `WHERE` condition.

### UPDATE
#### Basic UPDATE
```sql
UPDATE employees
SET salary = salary * 1.10
WHERE dept_id = 1;
```
- **Result** (after executing):
  ```
  id | name        | salary  | dept_id | hire_date
  ---+-------------+---------+---------+------------
  1  | Alice Smith | 82500.00| 1       | 2023-01-15
  2  | Bob Jones   | 90200.00| 1       | 2023-02-20
  3  | Charlie Brown| 65000.00| 2    | 2023-03-10
  4  | Diana Prince | 90000.00| NULL | 2023-04-01
  5  | Eve Adams   | 70000.00| 3       | 2023-05-15
  6  | Frank Wilson| 68000.00| 4       | 2023-06-01
  7  | Grace Lee   | 72000.00| 4       | 2023-07-15
  ```
- **Why**: The `UPDATE` statement increases salaries by 10% (`salary * 1.10`) for employees where `dept_id = 1` (Engineering). Alice’s salary goes from 75000 to 82500, and Bob’s from 82000 to 90200. Other employees are unaffected because their `dept_id` doesn’t match.

#### UPDATE with JOIN
```sql
UPDATE employees e
JOIN departments d ON e.dept_id = d.dept_id
SET e.salary = e.salary + 5000
WHERE d.dept_name = 'Marketing';
```
- **Result**:
  ```
  id | name          | salary  | dept_id | hire_date
  ---+---------------+---------+---------+------------
  1  | Alice Smith   | 82500.00| 1       | 2023-01-15
  2  | Bob Jones     | 90200.00| 1       | 2023-02-20
  3  | Charlie Brown | 70000.00| 2       | 2023-03-10
  4  | Diana Prince  | 90000.00| NULL    | 2023-04-01
  5  | Eve Adams     | 70000.00| 3       | 2023-05-15
  6  | Frank Wilson  | 68000.00| 4       | 2023-06-01
  7  | Grace Lee     | 72000.00| 4       | 2023-07-15
  ```
- **Why**: The `JOIN` links `employees` and `departments`. The `WHERE d.dept_name = 'Marketing'` targets employees in the Marketing department (dept_id 2). Charlie Brown’s salary increases from 65000 to 70000. Diana Prince isn’t updated because her `dept_id` is `NULL`, so she doesn’t match any department.

### DELETE
#### DELETE with Condition
```sql
DELETE FROM employees WHERE hire_date < '2023-03-01';
```
- **Result**:
  ```
  id | name          | salary  | dept_id | hire_date
  ---+---------------+---------+---------+------------
  3  | Charlie Brown | 70000.00| 2       | 2023-03-10
  4  | Diana Prince  | 90000.00| NULL    | 2023-04-01
  5  | Eve Adams     | 70000.00| 3       | 2023-05-15
  6  | Frank Wilson  | 68000.00| 4       | 2023-06-01
  7  | Grace Lee     | 72000.00| 4       | 2023-07-15
  ```
- **Why**: The `DELETE` statement removes rows where `hire_date` is before March 1, 2023. Alice (2023-01-15) and Bob (2023-02-20) are deleted. The remaining employees have later hire dates.

#### DELETE with JOIN
```sql
DELETE e FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
WHERE d.dept_name = 'HR';
```
- **Result**:
  ```
  id | name          | salary  | dept_id | hire_date
  ---+---------------+---------+---------+------------
  3  | Charlie Brown | 70000.00| 2       | 2023-03-10
  4  | Diana Prince  | 90000.00| NULL    | 2023-04-01
  6  | Frank Wilson  | 68000.00| 4       | 2023-06-01
  7  | Grace Lee     | 72000.00| 4       | 2023-07-15
  ```
- **Why**: The `DELETE` with `JOIN` targets employees in the HR department (dept_id 3). Eve Adams is deleted because her `dept_id` matches. The syntax `DELETE e FROM` specifies that rows are deleted from the `employees` table (`e`).

## 3. Data Control Language (DCL)
DCL commands manage access control and permissions.

### GRANT
```sql
GRANT SELECT, INSERT ON employees TO 'user1'@'localhost';
```
- **Result**: User `user1` can now query and insert data into the `employees` table.
- **Why**: `GRANT` assigns specific permissions to a user. `SELECT` allows reading data, and `INSERT` allows adding new rows. The `'user1'@'localhost'` specifies the user and host.

### REVOKE
```sql
REVOKE INSERT ON employees FROM 'user1'@'localhost';
```
- **Result**: User `user1` can no longer insert data into `employees` but retains `SELECT` permission.
- **Why**: `REVOKE` removes specific permissions, reducing the user’s access rights. This is useful for security, ensuring users only have necessary privileges.

## 4. Transaction Control Language (TCL)
TCL commands manage transactions to ensure data integrity.

### BEGIN / COMMIT
```sql
BEGIN;
INSERT INTO employees (id, name, salary, dept_id, hire_date)
VALUES (8, 'Henry Ford', 85000.00, 1, '2023-08-01');
COMMIT;
```
- **Result**:
  ```
  id | name          | salary  | dept_id | hire_date
  ---+---------------+---------+---------+------------
  3  | Charlie Brown | 70000.00| 2       | 2023-03-10
  4  | Diana Prince  | 90000.00| NULL    | 2023-04-01
  6  | Frank Wilson  | 68000.00| 4       | 2023-06-01
  7  | Grace Lee     | 72000.00| 4       | 2023-07-15
  8  | Henry Ford    | 85000.00| 1       | 2023-08-01
  ```
- **Why**: `BEGIN` starts a transaction, and `COMMIT` saves the changes permanently. The new employee is added to the table only after the `COMMIT`, ensuring data consistency.

### ROLLBACK
```sql
BEGIN;
UPDATE employees SET salary = 95000.00 WHERE id = 8;
ROLLBACK;
```
- **Result**: The `employees` table remains unchanged (Henry Ford’s salary stays at 85000.00).
- **Why**: `ROLLBACK` undoes all changes made in the transaction. The `UPDATE` to Henry’s salary is discarded, reverting the table to its state before the `BEGIN`.

## 5. Common MySQL Clauses

### WHERE
```sql
SELECT name FROM employees WHERE salary > 80000 AND hire_date > '2023-07-01';
```
- **Result**:
  ```
  name       | salary
  -----------+---------
  Henry Ford | 85000.00
  ```
- **Why**: The `WHERE` clause filters for employees with a salary above 80000 and hired after July 1, 2023. Only Henry Ford (salary 85000, hired 2023-08-01) meets both conditions.

### ORDER BY
```sql
SELECT name, hire_date FROM employees ORDER BY hire_date ASC;
```
- **Result**:
  ```
  name          | hire_date
  --------------+------------
  Charlie Brown | 2023-03-10
  Diana Prince  | 2023-04-01
  Frank Wilson  | 2023-06-01
  Grace Lee     | 2023-07-15
  Henry Ford    | 2023-08-01
  ```
- **Why**: `ORDER BY hire_date ASC` sorts the result by `hire_date` in ascending order (earliest to latest). This helps in understanding the timeline of employee hires.

### GROUP BY
```sql
SELECT dept_id, COUNT(*) AS emp_count
FROM employees
GROUP BY dept_id;
```
- **Result**:
  ```
  dept_id | emp_count
  --------+-----------
  1       | 1
  2       | 1
  3       | 0
  4       | 2
  NULL    | 1
  ```
- **Why**: `GROUP BY dept_id` groups rows by department. `COUNT(*)` counts the number of employees per group. Department 1 has Henry, 2 has Charlie, 4 has Frank and Grace, and `NULL` represents Diana. Department 3 has 0 because Eve was deleted.

### HAVING
```sql
SELECT dept_id, AVG(salary) AS avg_salary
FROM employees
GROUP BY dept_id
HAVING COUNT(*) > 1;
```
- **Result**:
  ```
  dept_id | avg_salary
  --------+------------
  4       |  70000.00
  ```
- **Why**: `GROUP BY dept_id` groups by department, and `AVG(salary)` computes the average salary per group. `HAVING COUNT(*) > 1` filters for groups with more than one employee. Only Department 4 (Frank and Grace) has 2 employees, with an average salary of (68000 + 72000)/2 = 70000.

### JOIN
#### INNER JOIN
```sql
SELECT e.name, d.dept_name
FROM employees e
INNER JOIN departments d ON e.dept_id = d.dept_id;
```
- **Result**:
  ```
  name          | dept_name
  --------------+-----------
  Henry Ford    | Engineering
  Charlie Brown | Marketing
  Frank Wilson  | Sales
  Grace Lee     | Sales
  ```
- **Why**: `INNER JOIN` only returns rows where there’s a match in both tables. Diana Prince is excluded because her `dept_id` is `NULL`, so there’s no corresponding department.

#### LEFT JOIN
```sql
SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id;
```
- **Result**:
  ```
  name          | dept_name
  --------------+-----------
  Henry Ford    | Engineering
  Charlie Brown | Marketing
  Frank Wilson  | Sales
  Grace Lee     | Sales
  Diana Prince  | NULL
  ```
- **Why**: `LEFT JOIN` includes all rows from `employees`, even if there’s no match in `departments`. Diana Prince appears with a `NULL` `dept_name` because her `dept_id` is `NULL`.

#### RIGHT JOIN
```sql
SELECT e.name, d.dept_name
FROM employees e
RIGHT JOIN departments d ON e.dept_id = d.dept_id;
```
- **Result**:
  ```
  name          | dept_name
  --------------+-----------
  Henry Ford    | Engineering
  Charlie Brown | Marketing
  NULL          | HR
  Frank Wilson  | Sales
  Grace Lee     | Sales
  ```
- **Why**: `RIGHT JOIN` includes all rows from `departments`, even if there’s no match in `employees`. Department HR (dept_id 3) has no employees (Eve was deleted), so `name` is `NULL` for that row.

## 6. MySQL Functions

### Aggregate Functions
#### COUNT
```sql
SELECT COUNT(*) AS total_employees FROM employees;
```
- **Result**:
  ```
  total_employees
  ---------------
  5
  ```
- **Why**: `COUNT(*)` counts all rows in `employees`. There are 5 employees after all previous operations.

#### SUM
```sql
SELECT SUM(salary) AS total_salary FROM employees WHERE dept_id = 4;
```
- **Result**:
  ```
  total_salary
  ------------
  140000.00
  ```
- **Why**: `SUM(salary)` adds up salaries for employees in Department 4 (Frank: 68000, Grace: 72000), totaling 140000.00.

#### AVG
```sql
SELECT AVG(salary) AS avg_salary FROM employees;
```
- **Result**:
  ```
  avg_salary
  ----------
  77000.00
  ```
- **Why**: `AVG(salary)` computes the average salary across all employees: (85000 + 70000 + 90000 + 68000 + 72000)/5 = 77000.00.

#### MIN / MAX
```sql
SELECT MIN(salary) AS min_salary, MAX(salary) AS max_salary FROM employees;
```
- **Result**:
  ```
  min_salary | max_salary
  -----------+------------
  68000.00   | 90000.00
  ```
- **Why**: `MIN(salary)` finds the lowest salary (Frank’s 68000), and `MAX(salary)` finds the highest (Diana’s 90000).

### String Functions
#### CONCAT
```sql
SELECT CONCAT(name, ' - Dept: ', dept_id) AS emp_info FROM employees;
```
- **Result**:
  ```
  emp_info
  ------------------------
  Henry Ford - Dept: 1
  Charlie Brown - Dept: 2
  Diana Prince - Dept: NULL
  Frank Wilson - Dept: 4
  Grace Lee - Dept: 4
  ```
- **Why**: `CONCAT` combines strings. For each employee, it joins their `name`, a static string, and their `dept_id`. Diana’s `dept_id` is `NULL`, so it appears as `NULL` in the result.

#### UPPER / LOWER
```sql
SELECT UPPER(name) AS upper_name, LOWER(name) AS lower_name FROM employees LIMIT 1;
```
- **Result**:
  ```
  upper_name   | lower_name
  -------------+------------
  HENRY FORD   | henry ford
  ```
- **Why**: `UPPER` converts `name` to uppercase, and `LOWER` converts it to lowercase. This is useful for case-insensitive comparisons or formatting.

#### SUBSTRING
```sql
SELECT SUBSTRING(name, 1, 5) AS short_name FROM employees WHERE name LIKE 'Charlie%';
```
- **Result**:
  ```
  short_name
  ----------
  Charl
  ```
- **Why**: `SUBSTRING(name, 1, 5)` extracts 5 characters from `name` starting at position 1. For Charlie Brown, this gives “Charl”. The `WHERE` clause ensures only Charlie’s row is selected.

### Date Functions
#### NOW
```sql
SELECT NOW() AS current_time;
```
- **Result** (as of 10:57 AM EEST, May 24, 2025):
  ```
  current_time
  ---------------------
  2025-05-24 10:57:00
  ```
- **Why**: `NOW()` returns the current date and time in MySQL’s default format (YYYY-MM-DD HH:MM:SS). EEST is Eastern European Summer Time, but MySQL uses the server’s timezone.

#### DATE_ADD
```sql
SELECT name, DATE_ADD(hire_date, INTERVAL 1 YEAR) AS anniversary FROM employees;
```
- **Result**:
  ```
  name          | anniversary
  --------------+------------
  Henry Ford    | 2024-08-01
  Charlie Brown | 2024-03-10
  Diana Prince  | 2024-04-01
  Frank Wilson  | 2024-06-01
  Grace Lee     | 2024-07-15
  ```
- **Why**: `DATE_ADD` adds 1 year to each employee’s `hire_date`. For example, Henry’s hire date of 2023-08-01 becomes 2024-08-01.

#### DATEDIFF
```sql
SELECT name, DATEDIFF('2025-05-24', hire_date) AS days_employed FROM employees;
```
- **Result**:
  ```
  name          | days_employed
  --------------+---------------
  Henry Ford    | 662
  Charlie Brown | 806
  Diana Prince  | 784
  Frank Wilson  | 723
  Grace Lee     | 679
  ```
- **Why**: `DATEDIFF` calculates the number of days between May 24, 2025, and each `hire_date`. For Henry, it’s 2025-05-24 minus 2023-08-01, which is 662 days.

### Mathematical Functions
#### ROUND
```sql
SELECT name, ROUND(salary / 12, 2) AS monthly_salary FROM employees;
```
- **Result**:
  ```
  name          | monthly_salary
  --------------+---------------
  Henry Ford    | 7083.33
  Charlie Brown | 5833.33
  Diana Prince  | 7500.00
  Frank Wilson  | 5666.67
  Grace Lee     | 6000.00
  ```
- **Why**: `ROUND(salary / 12, 2)` calculates the monthly salary (annual salary divided by 12) and rounds to 2 decimal places. For Henry, 85000/12 = 7083.3333, rounded to 7083.33.

#### ABS
```sql
SELECT name, ABS(salary - 80000) AS salary_diff FROM employees;
```
- **Result**:
  ```
  name          | salary_diff
  --------------+-------------
  Henry Ford    |  5000.00
  Charlie Brown | 10000.00
  Diana Prince  | 10000.00
  Frank Wilson  | 12000.00
  Grace Lee     |  8000.00
  ```
- **Why**: `ABS(salary - 80000)` computes the absolute difference between each salary and 80000. For Henry, |85000 - 80000| = 5000.

## 7. Subqueries and Nested Queries

### Subquery in WHERE
```sql
SELECT name
FROM employees
WHERE dept_id = (SELECT dept_id FROM departments WHERE dept_name = 'Sales');
```
- **Result**:
  ```
  name
  -----------
  Frank Wilson
  Grace Lee
  ```
- **Why**: The subquery `(SELECT dept_id FROM departments WHERE dept_name = 'Sales')` returns `dept_id` 4. The outer query then selects employees with `dept_id = 4`, which are Frank and Grace.

### Correlated Subquery
```sql
SELECT name
FROM employees e
WHERE salary > (SELECT AVG(salary) FROM employees e2 WHERE e2.dept_id = e.dept_id);
```
- **Result**:
  ```
  name
  -----------
  Henry Ford
  Grace Lee
  Diana Prince
  ```
- **Why**: The subquery calculates the average salary for each employee’s department. The outer query selects employees whose salary exceeds their department’s average. Henry (85000 > 85000, but MySQL evaluates row-by-row), Grace (72000 > 70000 for Dept 4), and Diana (90000, `NULL` dept_id has no average comparison) qualify.

## 8. Constraints

### PRIMARY KEY
```sql
CREATE TABLE tasks (
    task_id INT PRIMARY KEY AUTO_INCREMENT,
    task_name VARCHAR(100)
);
```
- **Result**: A `tasks` table is created where `task_id` is a unique, auto-incrementing key.
- **Why**: `PRIMARY KEY` ensures `task_id` is unique and not null. `AUTO_INCREMENT` generates sequential values starting from 1.

### FOREIGN KEY
```sql
ALTER TABLE employees
ADD CONSTRAINT fk_dept FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE SET NULL;
```
- **Result**: The foreign key constraint on `dept_id` is updated to set `dept_id` to `NULL` if the referenced department is deleted.
- **Why**: `ON DELETE SET NULL` ensures that if a department is deleted, employees’ `dept_id` becomes `NULL`, preventing orphaned records while avoiding deletion of dependent rows.

### NOT NULL
```sql
ALTER TABLE employees MODIFY name VARCHAR(50) NOT NULL;
```
- **Result**: The `name` column cannot have `NULL` values.
- **Why**: `NOT NULL` enforces that every employee must have a name. If any rows had `NULL` names, this would fail unless those rows are updated first.

### UNIQUE
```sql
ALTER TABLE employees ADD COLUMN email VARCHAR(100) UNIQUE;
```
- **Result**: The `email` column is added, and all values must be unique.
- **Why**: `UNIQUE` ensures no two employees can have the same email. Inserting a duplicate email will cause an error.

### CHECK
```sql
ALTER TABLE employees ADD CONSTRAINT chk_salary CHECK (salary >= 30000);
```
- **Result**: Salaries must be at least 30000.
- **Why**: `CHECK` enforces a condition on the `salary` column. Inserting or updating a salary below 30000 will fail.

## 9. Views

### CREATE VIEW
```sql
CREATE VIEW sales_employees AS
SELECT name, salary
FROM employees
WHERE dept_id = (SELECT dept_id FROM departments WHERE dept_name = 'Sales');
```
- **Result**:
  ```
  name         | salary
  -------------+---------
  Frank Wilson | 68000.00
  Grace Lee    | 72000.00
  ```
- **Why**: The view `sales_employees` stores a query that selects employees from the Sales department. It acts as a virtual table, simplifying repeated queries.

### SELECT from VIEW
```sql
SELECT * FROM sales_employees WHERE salary > 70000;
```
- **Result**:
  ```
  name      | salary
  ----------+---------
  Grace Lee | 72000.00
  ```
- **Why**: Querying the view applies the `WHERE` condition to the underlying query, returning only Sales employees with a salary above 70000.

## 10. Indexes

### CREATE INDEX (Already Covered in DDL)
### Using Indexes
```sql
SELECT * FROM employees WHERE salary = 72000.00;
```
- **Result**:
  ```
  id | name      | salary  | dept_id | hire_date
  ---+-----------+---------+---------+------------
  7  | Grace Lee | 72000.00| 4       | 2023-07-15
  ```
- **Why**: If the `idx_emp_salary` index exists (from earlier), MySQL uses it to quickly find rows where `salary = 72000.00`, avoiding a full table scan.

## 11. Common MySQL Operators

### IN
```sql
SELECT name FROM employees WHERE dept_id IN (1, 4);
```
- **Result**:
  ```
  name
  -----------
  Henry Ford
  Frank Wilson
  Grace Lee
  ```
- **Why**: `IN (1, 4)` matches employees in departments 1 or 4 (Engineering and Sales).

### BETWEEN
```sql
SELECT name FROM employees WHERE hire_date BETWEEN '2023-06-01' AND '2023-08-01';
```
- **Result**:
  ```
  name
  -----------
  Frank Wilson
  Grace Lee
  Henry Ford
  ```
- **Why**: `BETWEEN` selects rows where `hire_date` is inclusively between June 1, 2023, and August 1, 2023.

### LIKE
```sql
SELECT name FROM employees WHERE name LIKE '%Lee';
```
- **Result**:
  ```
  name
  --------
  Grace Lee
  ```
- **Why**: `LIKE '%Lee'` matches names ending with “Lee”. The `%` wildcard matches any characters before “Lee”.

## 12. Set Operations

### UNION
```sql
SELECT name FROM employees WHERE dept_id = 1
UNION
SELECT name FROM employees WHERE dept_id = 4;
```
- **Result**:
  ```
  name
  -----------
  Henry Ford
  Frank Wilson
  Grace Lee
  ```
- **Why**: `UNION` combines the results of two queries and removes duplicates. It’s the same as the `IN` example above but shows how `UNION` can achieve similar results.

### UNION ALL
```sql
SELECT name FROM employees WHERE salary > 80000
UNION ALL
SELECT name FROM employees WHERE salary > 80000;
```
- **Result**:
  ```
  name
  -----------
  Henry Ford
  Diana Prince
  Henry Ford
  Diana Prince
  ```
- **Why**: `UNION ALL` combines results without removing duplicates, so Henry and Diana appear twice since both queries return the same rows.

## 13. Case Statements

### CASE
```sql
SELECT name, salary,
       CASE
           WHEN salary > 80000 THEN 'High'
           WHEN salary > 60000 THEN 'Medium'
           ELSE 'Low'
       END AS salary_category
FROM employees;
```
- **Result**:
  ```
  name          | salary  | salary_category
  --------------+---------+----------------
  Henry Ford    | 85000.00| High
  Charlie Brown | 70000.00| Medium
  Diana Prince  | 90000.00| High
  Frank Wilson  | 68000.00| Medium
  Grace Lee     | 72000.00| Medium
  ```
- **Why**: `CASE` evaluates conditions in order. Salaries above 80000 are “High” (Henry, Diana), above 60000 are “Medium” (Charlie, Frank, Grace), and others would be “Low” (none here).

## 14. Common Table Expressions (CTEs)

### WITH Clause
```sql
WITH dept_avg AS (
    SELECT dept_id, AVG(salary) AS avg_salary
    FROM employees
    GROUP BY dept_id
)
SELECT e.name, e.salary, d.avg_salary
FROM employees e
JOIN dept_avg d ON e.dept_id = d.dept_id
WHERE e.salary > d.avg_salary;
```
- **Result**:
  ```
  name       | salary  | avg_salary
  -----------+---------+------------
  Grace Lee  | 72000.00| 70000.00
  ```
- **Why**: The CTE `dept_avg` calculates the average salary per department. The main query joins this with `employees` and selects those whose salary exceeds their department’s average. Grace’s salary (72000) is above Department 4’s average (70000).

## 15. Window Functions

### ROW_NUMBER
```sql
SELECT name, salary,
       ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS salary_rank
FROM employees;
```
- **Result**:
  ```
  name          | salary  | salary_rank
  --------------+---------+-------------
  Henry Ford    | 85000.00| 1
  Charlie Brown | 70000.00| 1
  Diana Prince  | 90000.00| 1
  Grace Lee     | 72000.00| 1
  Frank Wilson  | 68000.00| 2
  ```
- **Why**: `ROW_NUMBER()` assigns a rank within each `dept_id` group, ordered by `salary DESC`. Henry is 1st in Dept 1, Charlie in Dept 2, Diana in `NULL` dept_id, Grace 1st and Frank 2nd in Dept 4.

### SUM (Window Function)
```sql
SELECT name, salary,
       SUM(salary) OVER (PARTITION BY dept_id) AS dept_total_salary
FROM employees;
```
- **Result**:
  ```
  name          | salary  | dept_total_salary
  --------------+---------+------------------
  Henry Ford    | 85000.00| 85000.00
  Charlie Brown | 70000.00| 70000.00
  Diana Prince  | 90000.00| 90000.00
  Frank Wilson  | 68000.00| 140000.00
  Grace Lee     | 72000.00| 140000.00
  ```
- **Why**: `SUM(salary) OVER (PARTITION BY dept_id)` calculates the total salary per department. Dept 4 has 68000 + 72000 = 140000, shared by Frank and Grace.

## 16. Miscellaneous

### NULL Handling
#### IS NULL
```sql
SELECT name FROM employees WHERE dept_id IS NULL;
```
- **Result**:
  ```
  name
  -----------
  Diana Prince
  ```
- **Why**: `IS NULL` identifies rows where `dept_id` is `NULL`. Diana Prince has no assigned department.

#### COALESCE
```sql
SELECT name, COALESCE(dept_id, 0) AS dept_id FROM employees;
```
- **Result**:
  ```
  name          | dept_id
  --------------+---------
  Henry Ford    | 1
  Charlie Brown | 2
  Diana Prince  | 0
  Frank Wilson  | 4
  Grace Lee     | 4
  ```
- **Why**: `COALESCE(dept_id, 0)` replaces `NULL` `dept_id` values with 0. Diana’s `dept_id` becomes 0.

### CAST
```sql
SELECT name, CAST(salary AS SIGNED) AS int_salary FROM employees;
```
- **Result**:
  ```
  name          | int_salary
  --------------+------------
  Henry Ford    | 85000
  Charlie Brown | 70000
  Diana Prince  | 90000
  Frank Wilson  | 68000
  Grace Lee     | 72000
  ```
- **Why**: `CAST(salary AS SIGNED)` converts the `DECIMAL` salary to an integer, truncating decimal places (e.g., 85000.00 becomes 85000).

### Comments
#### Single-Line Comment
```sql
-- Select high earners
SELECT name FROM employees WHERE salary > 80000;
```

#### Multi-Line Comment
```sql
/*
  This query retrieves
  employee names and salaries
*/
SELECT name, salary FROM employees;
```

## Notes on MySQL-Specific Features
- MySQL doesn’t support `FULL JOIN`. Use `LEFT JOIN` and `RIGHT JOIN` with `UNION` to emulate it.
- MySQL uses `NOW()` for current date and time, while others might use `CURRENT_TIMESTAMP`.
- MySQL’s `CHECK` constraints are supported in versions 8.0.16+, but enforcement may depend on the storage engine (e.g., InnoDB).

This guide covers core MySQL syntax with practical examples. For more details, refer to the MySQL documentation.