| column_name    | data_type                | length_or_precision | description |
| -------------- | ------------------------ | ------------------- | ----------- |
| id             | uuid                     | null                | Primary key, Unique identifier for the schedule/period record.        |
| institution_id | uuid                     | null                | Foreign key referencing the institution this schedule belongs to.        |
| name           | text                     | null                | Name or title of the time slot (e.g., "Period 1", "Lunch Break").        |
| start_time     | time without time zone   | null                | The scheduled starting time of the period.        |
| end_time       | time without time zone   | null                | The scheduled ending time of the period.        |
| sort_order     | integer                  | 32                  | Number used to order the periods chronologically for display.        |
| is_break       | boolean                  | null                | Flag indicating whether the time slot is a designated break (True/False).        |
| is_active      | boolean                  | null                | Status flag indicating if this schedule period is currently active and in use.        |
| created_at     | timestamp with time zone | null                | Timestamp recording exactly when the record was created.        |
| updated_at     | timestamp with time zone | null                | Timestamp recording exactly when the record was last modified.        |
**Purpose**: To store and sequence the daily bell schedule, defining class periods and breaks for the institution.
**Primary Key**: `id`
