| column_name           | data_type                | length_or_precision | description |
| --------------------- | ------------------------ | ------------------- | ----------- |
| id                    | uuid                     | null                | Primary key, Unique identifier for the attendance record. |
| student_enrollment_id | uuid                     | null                | Foreign key referencing the enrolled student whose attendance is being marked. |
| timetable_entry_id    | uuid                     | null                | Foreign key referencing the specific class session for which attendance is recorded. |
| date                  | date                     | null                | The date when the class occurred and attendance was marked. |
| status                | text                     | null                | The student's attendance status (e.g., 'Present', 'Absent', 'Late', 'Unmarked'). |
| marked_by             | uuid                     | null                | Foreign key referencing the faculty or admin who recorded the attendance. |
| remarks               | text                     | null                | Optional text for additional notes or reasons regarding the attendance status. |
| created_at            | timestamp with time zone | null                | Timestamp recording exactly when the record was created. |
| updated_at            | timestamp with time zone | null                | Timestamp recording exactly when the record was last modified. |

**Purpose**: To securely record and track the daily attendance status (Present, Absent, etc.) for each enrolled student per class session.
**Primary Key**: `id`
