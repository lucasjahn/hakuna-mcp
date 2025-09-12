# MCP Tools & Parameter Guide

## Conventions
- Dates: `yyyy-mm-dd` (ISO, zero-padded). Example: `2025-09-12`.
- Times: `HH:mm` 24-hour. Example: `08:05`, `17:30`.
- IDs: numbers. Resolve via `find_projects` and `find_tasks` if needed.
- Output: JSON objects/arrays returned as text content; parse if your client supports it.

## Tools
- `list_time_entries`
  - Inputs: `start_date` (yyyy-mm-dd), `end_date` (yyyy-mm-dd), optional `project_id`, `task_id`, `user_id`.
  - Returns: `{ entries: [...], meta: string }` where meta may include rate-limit info.

- `get_time_entry`
  - Inputs: `id` (number).
  - Returns: single entry object.

- `create_time_entry`
  - Inputs: `date` (yyyy-mm-dd), `start_time` (HH:mm), `end_time` (HH:mm), `task_id` (number), optional `project_id` (number), `note` (string), `user_id` (number).
  - Returns: created entry.

- `update_time_entry`
  - Inputs: `id` (number) plus any subset of: `date` (yyyy-mm-dd), `start_time` (HH:mm), `end_time` (HH:mm), `task_id` (number), `project_id` (number), `note` (string).
  - Returns: updated entry.

- `delete_time_entry`
  - Inputs: `id` (number).
  - Behavior: disabled; returns a refusal message.

- `get_timer`
  - Inputs: optional `user_id` (number).
  - Returns: current timer state.

- `start_timer`
  - Inputs: optional `project_id` (number), `task_id` (number), `note` (string).
  - Returns: timer state after start.

- `stop_timer`
  - Inputs: optional `end_time` (HH:mm), `user_id` (number).
  - Returns: timer state after stop.

- `find_projects`
  - Inputs: `name` (string, substring match).
  - Returns: `[ { id, name } ]`.

- `find_tasks`
  - Inputs: `name` (string), optional `project_id` (number).
  - Returns: `[ { id, name, project_id } ]`.

- `total_hours_in_period`
  - Inputs: `start_date`, `end_date` (yyyy-mm-dd), optional `project_id`, `task_id`.
  - Returns: `{ hours_decimal: number }` (rounded to 2 decimals).

- `hours_by_project`
  - Inputs: `start_date`, `end_date` (yyyy-mm-dd).
  - Returns: `[ { project_id, project_name, hours_decimal } ]` (2-decimal rounding).

- `hours_on_day`
  - Inputs: `date` (yyyy-mm-dd), optional `project_id`, `task_id`.
  - Returns: `{ date, hours_decimal }`.

- `clear_catalog_cache`
  - Inputs: none.
  - Behavior: clears in-memory caches for projects/tasks.

## Notes
- Duration math tolerates simple overnight spans (end < start → +24h).
- Rate limits are handled automatically; some responses include remaining/limit/reset seconds in `meta`.
