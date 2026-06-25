# MDJ SpaceVanta - Supabase Integration Guide

This guide documents the database architecture, authentication strategies, custom triggers, and batch CSV import portals implemented for the MDJ SpaceVanta React application.

---

## 1. Database Schema & Architecture

The database is built on **PostgreSQL (Supabase)**. All SQL configurations are located in [supabase_schema.sql](file:///c:/Users/sveer/Desktop/mdj%20spacevanta/supabase_schema.sql).

### Table Structures
* **`schools`**: Stores school names and custom UUID identifiers.
* **`profiles`**: Extends Supabase `auth.users`. Connects users to a `school_id` and specifies their `role` (`student` or `admin`).
* **`students`**: Extends the user's profile with student-specific properties like `roll_number` and `class_name`. Uses a unique constraint: `unique_school_roll_number UNIQUE (school_id, roll_number)`.
* **`admins`**: Extends the user's profile with admin-specific properties like `username`. Uses a unique constraint: `unique_school_username UNIQUE (school_id, username)`.
* **`demo_requests`**: Stores public demo requests submitted via the homepage.

---

## 2. Authentication Strategy & Virtual Emails

Standard Supabase Auth requires an **Email** and **Password**. To support the custom UI requirements without changing the fields (Student log in via *School + Class + Roll Number*; Admin log in via *School + Username*), we employ a **Virtual Email Strategy** behind the scenes:

* **Student Email**: `student_[school_id]_[roll_number]@spacevanta.local`
* **Admin Email**: `admin_[school_id]_[username]@spacevanta.local`

These virtual emails are deterministic. When a student or administrator logs in, the application converts their inputs into this email format and sends it directly to Supabase Auth (`signInWithPassword`).

---

## 3. Database Triggers & Fallback Parsing

### Automatic Profile Trigger (`handle_new_user()`)
A PostgreSQL trigger runs `AFTER INSERT ON auth.users` to automatically populate the `profiles`, `students`, and `admins` tables.

* **Standard Flow**: Parses metadata (`school_id`, `role`, `roll_number`, `class_name`, `username`) provided during registration or RPC calls.
* **Direct Supabase UI Fallback**: If a user is created manually inside the Supabase Auth Dashboard, no metadata is sent. The trigger automatically parses the virtual email local-part by splitting it at the `_` character to extract the **role**, the **school ID**, and the **username** or **roll number**. The trigger automatically sets the administrator's default profile name to `'Principal'` (previously `'System Manual User'`) if no explicit name is provided in the metadata.

---

## 4. Cascaded Dropdown Student Login

Instead of typing Class Name and Roll Number manually (which is prone to typos), the Student login form uses cascading dropdowns powered by two public Postgres helper functions:

1. **`get_school_classes(p_school_id)`**: Fetches all unique classes registered in the selected school.
2. **`get_class_roll_numbers(p_school_id, p_class_name)`**: Fetches all unique roll numbers registered under the selected class.

These functions run with `SECURITY DEFINER` permissions. This allows unauthenticated users to safely query classes and roll numbers for select lists before they log in.

---

## 5. CSV Batch Upload Engine

Administrators can batch-import student and admin credentials inside their dashboard using custom CSV files.

### Template Formats
* **Students template**: [students_sample.csv](file:///c:/Users/sveer/Desktop/mdj%20spacevanta/react-app/students_sample.csv)
  ```csv
  full_name,roll_number,class_name,password
  "Aria Chen","1001","Class 10-A","ariaPass99"
  ```
* **Admins template**: [admins_sample.csv](file:///c:/Users/sveer/Desktop/mdj%20spacevanta/react-app/admins_sample.csv)
  ```csv
  full_name,username,password
  "Sarah Jenkins","sarahadmin","sarahPass99"
  ```

### Batch RPC Functions
To create logins without signing out the active administrator session, the React app invokes these database functions on the server:
* **`create_student_user`**: Inserts a new student into `auth.users` with the correct password encryption and metadata.
* **`create_admin_user`**: Inserts a new admin into `auth.users` with the correct password encryption and metadata.

Both functions check that `auth.uid()` belongs to an administrator and throws a database exception if duplicate records are found.

---

## 6. How to Run Locally

### 1. Apply Schema
Run the contents of [supabase_schema.sql](file:///c:/Users/sveer/Desktop/mdj%20spacevanta/supabase_schema.sql) in your **Supabase SQL Editor**.

### 2. Configure Environment
Update your credentials in [react-app/.env](file:///c:/Users/sveer/Desktop/mdj%20spacevanta/react-app/.env):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Development Server
```bash
npm install
npm run dev
```
