| column_name    | data_type                | length_or_precision | description |
| -------------- | ------------------------ | ------------------- | ----------- |
| id             | uuid                     | null                | Primary key, Unique identifier for the exam/assessment record. |
| institution_id | uuid                     | null                | Foreign key referencing the institution conducting the exam. |
| subject_id     | uuid                     | null                | Foreign key referencing the specific subject being tested. |
| class_id       | uuid                     | null                | Foreign key referencing the specific class taking the exam. |
| semester_id    | uuid                     | null                | Foreign key referencing the academic semester in which the exam occurs. |
| exam_type      | text                     | null                | Type of the examination (e.g., 'Internal', 'External', 'Midterm', 'Assignment'). |
| name           | text                     | null                | Title or name of the exam (e.g., 'First Midterm', 'Final Lab Exam'). |
| max_marks      | numeric                  | 6                   | The maximum possible score achievable for this exam. |
| weightage      | numeric                  | 5                   | The percentage weight this exam carries towards the final subject grade. |
| exam_date      | date                     | null                | The scheduled date for the examination. |
| description    | text                     | null                | Optional text providing additional details or syllabus coverage for the exam. |
| is_published   | boolean                  | null                | Flag indicating whether the exam details/results are visible to students. |
| created_at     | timestamp with time zone | null                | Timestamp recording exactly when the record was created. |
| updated_at     | timestamp with time zone | null                | Timestamp recording exactly when the record was last modified. |

**Purpose**: To define and manage academic examinations, including their scheduling, maximum marks, and weightage toward final grades.
**Primary Key**: `id`
