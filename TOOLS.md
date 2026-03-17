# MCP Tools & Parameter Guide

## Conventions
- Dates: `yyyy-mm-dd` (ISO, zero-padded). Example: `2025-09-12`.
- Times: `HH:mm` 24-hour. Example: `08:05`, `17:30`.
- IDs: numbers. Resolve via `find_projects` and `find_tasks` if needed.
- Output: JSON objects/arrays returned as text content; parse if your client supports it.

## Tools Overview

| Tool | Description |
|------|-------------|
| `list_time_entries` | List time entries in a date range with optional filters |
| `get_time_entry` | Fetch a single time entry by ID |
| `create_time_entry` | Create a new time entry |
| `update_time_entry` | Update fields on an existing time entry (PATCH) |
| `delete_time_entry` | Disabled — always returns a refusal message |
| `get_timer` | Read the currently running timer |
| `start_timer` | Start a new timer |
| `stop_timer` | Stop the running timer and save as time entry |
| `cancel_timer` | Discard the running timer without saving |
| `find_projects` | Search projects by name substring |
| `find_tasks` | Search tasks by name substring |
| `total_hours_in_period` | Sum durations in a date range |
| `hours_by_project` | Group and sum durations by project |
| `hours_on_day` | Sum durations for a single date |
| `get_overview` | Get overtime balance and vacation days |
| `list_absences` | List absences for a given year |
| `get_current_user` | Get the authenticated user's profile |
| `list_absence_types` | List available absence types (cached) |
| `get_company` | Get company info and settings |
| `clear_catalog_cache` | Clear cached projects, tasks, and absence types |

## Tool Details

### Time Entries

- **`list_time_entries`**
  - Inputs: `start_date` (yyyy-mm-dd), `end_date` (yyyy-mm-dd), optional `project_id`, `task_id`, `user_id`.
  - Returns: `{ entries: [...], meta: string }` where meta may include rate-limit info.

- **`get_time_entry`**
  - Inputs: `id` (number).
  - Returns: single entry object.

- **`create_time_entry`**
  - Inputs: `date` (yyyy-mm-dd), `start_time` (HH:mm), `end_time` (HH:mm), `task_id` (number, required), optional `project_id` (number), `note` (string), `user_id` (number).
  - Returns: created entry.

- **`update_time_entry`**
  - Inputs: `id` (number) plus any subset of: `date`, `start_time`, `end_time`, `task_id`, `project_id`, `note`.
  - Returns: updated entry.

- **`delete_time_entry`**
  - Inputs: `id` (number).
  - Behavior: disabled; returns a refusal message.

### Timer

- **`get_timer`**
  - Inputs: optional `user_id` (number).
  - Returns: current timer state (or empty/null if none running).

- **`start_timer`**
  - Inputs: `task_id` (number, required), optional `project_id` (number), `start_time` (HH:mm), `note` (string).
  - Returns: timer state after start.

- **`stop_timer`**
  - Inputs: optional `end_time` (HH:mm), `user_id` (number).
  - Returns: the created time entry.

- **`cancel_timer`**
  - Inputs: optional `user_id` (number).
  - Returns: confirmation. The tracked time is discarded.

### Finders

- **`find_projects`**
  - Inputs: `name` (string, substring match, case-insensitive).
  - Returns: `[ { id, name } ]`.

- **`find_tasks`**
  - Inputs: `name` (string, case-insensitive), optional `project_id` (number).
  - Returns: `[ { id, name, project_id } ]`.

### Analytics

- **`total_hours_in_period`**
  - Inputs: `start_date`, `end_date` (yyyy-mm-dd), optional `project_id`, `task_id`.
  - Returns: `{ hours_decimal: number }` (rounded to 2 decimals).

- **`hours_by_project`**
  - Inputs: `start_date`, `end_date` (yyyy-mm-dd).
  - Returns: `[ { project_id, project_name, hours_decimal } ]`.

- **`hours_on_day`**
  - Inputs: `date` (yyyy-mm-dd), optional `project_id`, `task_id`.
  - Returns: `{ date, hours_decimal }`.

### Overview & Absences

- **`get_overview`**
  - Inputs: none.
  - Returns: overtime balance and vacation days (redeemed/remaining).

- **`list_absences`**
  - Inputs: `year` (number, e.g. 2026).
  - Returns: array of absence records with dates, type, and status.

- **`list_absence_types`**
  - Inputs: none.
  - Returns: array of available absence types. Results are cached; use `clear_catalog_cache` to refresh.

### User & Company

- **`get_current_user`**
  - Inputs: none.
  - Returns: authenticated user profile (name, email, role).

- **`get_company`**
  - Inputs: none.
  - Returns: company info including name, settings, and features.

### Cache

- **`clear_catalog_cache`**
  - Inputs: none.
  - Behavior: clears in-memory caches for projects, tasks, and absence types.

## Notes
- Duration math tolerates simple overnight spans (end < start → +24h).
- Rate limits are handled automatically; some responses include remaining/limit/reset seconds in `meta`.
