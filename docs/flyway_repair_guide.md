# Flyway Database Repair & Migration Guide

This document explains the schema migration policy for Planora, how to handle Flyway migration mismatches, and how to repair environments that applied the now-deleted legacy empty migrations.

---

## 1. Flyway Migration Policy

In Planora, all database schema changes are managed strictly via Flyway versioned migrations.

### No Auto-Repair in Production
By default, the application disables automatic Flyway schema history repair on startup in production environments.
* **Property:** `app.flyway.repair-on-startup=false` (configured in `application.properties`)
* **Rationale:** Auto-repairing schema history in production can silently hide unintended database schema drifts or migration file alterations. If a checksum mismatch or missing migration error occurs, the application startup MUST fail so that administrators can manually inspect the database state before applying further migrations.

### Local Development Environment
In local development, developers frequently switch branches, which may cause database schema history differences. Therefore, auto-repair remains enabled by default for development.
* **Property:** `app.flyway.repair-on-startup=true` (configured in `application-dev.properties`)

---

## 2. Legacy Empty Migrations Cleanup

Three empty migration files that did not alter the schema were cleaned up from the codebase:
1. `V18.1__add_task_title_length_constraint.sql`
2. `V19.1__add_folder_permissions.sql`
3. `V20.1__add_task_archiving.sql`

Because these empty migrations had previously been applied in some shared/testing databases (such as the main staging Supabase database), environments running against these databases will encounter a validation error on startup:

> `Migration missing on classpath: 18.1, 19.1, 20.1`

### Resolution Strategy

To align the database state with the clean codebase, you must remove the records of these three deleted migrations from the schema history. Use one of the following methods:

#### Method A: Run Clean-up SQL (Recommended)
Connect to the target database using your preferred client (e.g., `psql` or Supabase SQL Editor) and execute the following query:

```sql
-- Remove records of the deleted empty migrations from Flyway history
DELETE FROM flyway_schema_history 
WHERE version IN ('18.1', '19.1', '20.1');
```

#### Method B: Run Flyway Repair via CLI
If you have the Flyway Command Line Tool installed, run the `repair` command against the target database:

```bash
flyway repair \
  -url="jdbc:postgresql://<host>:<port>/<db>" \
  -user="<username>" \
  -password="<password>"
```
*Note: This command aligns the `flyway_schema_history` table with the current classpath migrations by removing records of any migrations no longer present in the classpath.*

---

## 3. Resolving Checksum Mismatches in Production

If a migration file has been modified after it was applied to a database, Flyway will raise a checksum mismatch error on startup:

> `Migration checksum mismatch for migration version X.X`

### Immediate Resolution

If a checksum mismatch is detected in production, **never** manually turn on `repair-on-startup`. Instead, follow these steps to investigate and resolve:

#### Step 1: Diagnose the Change
Compare the migration file in the code against the actual schema applied to the database. Determine if the file content changed due to a git merge conflict, line ending difference (LF vs CRLF), or an intentional edit.

#### Step 2: Choose a Resolution Path

* **Option A: Revert the Code Modification (Best Practice)**
  If the file was modified by mistake, revert the code change to match the version that was already applied. Create a *new* versioned migration (e.g., `VY__modify_column.sql`) for any additional schema updates.

* **Option B: Manually Align the Checksum in the Database**
  If the code modification is correct and already manually applied/safe, you can update the checksum in `flyway_schema_history` to match the new code's checksum:
  1. Let the application fail on startup. Find the **calculated checksum** of the migration file reported in the console error log.
  2. Update the checksum value in the history table:
     ```sql
     UPDATE flyway_schema_history 
     SET checksum = <new_calculated_checksum> 
     WHERE version = '<version>';
     ```

* **Option C: Perform a Controlled Manual Repair**
  Run `flyway repair` via CLI or temporary environment overrides on a non-production clone first to verify.
