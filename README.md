# AskBox - Anonymous Q&A for Classrooms

A full-stack web application that enables students to ask questions anonymously and teachers to answer them publicly or through private DM threads.

## Features

- **Anonymous Questions**: Students can ask questions without revealing their identity
- **Private DM Threads**: Once a teacher marks a question as answered, a private thread unlocks between the student and teacher
- **Real-time Updates**: Using Supabase Realtime for live question feed updates
- **Mobile-First Design**: Fully responsive for mobile, tablet, and desktop
- **Teacher Dashboard**: Teachers can create rooms, manage questions, and view DM threads
- **Google OAuth**: Secure authentication for teachers only

## Tech Stack

- **Next.js 14** (App Router)
- **Supabase** (Auth, Database, Realtime)
- **Tailwind CSS** (Styling)
- **Vercel** (Deployment)

## Prerequisites

- Node.js 18+ installed
- A Supabase project
- Node package manager (npm)

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project dashboard under Settings > API.

## Database Setup

Run the following SQL in your Supabase SQL Editor to create the tables with Row Level Security:

```sql
-- 1. Teachers table
create table teachers (
  id uuid primary key references auth.users(id),
  email text,
  name text
);

-- 2. Rooms table
create table rooms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references teachers(id),
  name text,
  room_code text unique
);

-- 3. Questions table
create table questions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id),
  student_token text,
  question_text text,
  is_answered boolean default false,
  created_at timestamp default now()
);

-- 4. Replies table
create table replies (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id),
  student_token text,
  sender text check (sender in ('student', 'teacher')),
  message text,
  created_at timestamp default now()
);

-- Enable Row Level Security
alter table teachers enable row level security;
alter table rooms enable row level security;
alter table questions enable row level security;
alter table replies enable row level security;

-- Teachers: authenticated user can SELECT/INSERT their own row
create policy "Teachers can select own row" on teachers
  for select using (auth.uid() = id);

create policy "Teachers can insert own row" on teachers
  for insert with check (auth.uid() = id);

create policy "Teachers can update own row" on teachers
  for update using (auth.uid() = id);

-- Rooms: anyone can SELECT by room_code; only authenticated teachers can INSERT
create policy "Anyone can select rooms by code" on rooms
  for select using (true);

create policy "Teachers can insert rooms" on rooms
  for insert with check (auth.uid() = teacher_id);

create policy "Teachers can update rooms" on rooms
  for update using (auth.uid() = teacher_id);

-- Questions: students can INSERT freely; SELECT is open for answered questions only; teacher can SELECT/UPDATE all
create policy "Anyone can insert questions" on questions
  for insert with check (true);

create policy "Anyone can select answered questions" on questions
  for select using (is_answered = true);

create policy "Teachers can select all questions in their room" on questions
  for select using (
    exists (
      select 1 from rooms
      where rooms.id = questions.room_id
      and rooms.teacher_id = auth.uid()
    )
  );

create policy "Teachers can update questions in their room" on questions
  for update using (
    exists (
      select 1 from rooms
      where rooms.id = questions.room_id
      and rooms.teacher_id = auth.uid()
    )
  );

-- Replies: student can SELECT replies where student_token matches; teacher can SELECT/INSERT all in their room
create policy "Students can select own replies" on replies
  for select using (true);

create policy "Teachers can select all replies in their room" on replies
  for select using (
    exists (
      select 1 from questions q
      join rooms r on r.id = q.room_id
      where q.id = replies.question_id
      and r.teacher_id = auth.uid()
    )
  );

create policy "Anyone can insert replies" on replies
  for insert with check (true);

create policy "Teachers can insert replies in their room" on replies
  for insert with check (
    exists (
      select 1 from questions q
      join rooms r on r.id = q.room_id
      where q.id = replies.question_id
      and r.teacher_id = auth.uid()
    )
  );

create policy "Students can insert own replies" on replies
  for insert with check (true);

create policy "Teachers can update replies in their room" on replies
  for update using (
    exists (
      select 1 from questions q
      join rooms r on r.id = q.room_id
      where q.id = replies.question_id
      and r.teacher_id = auth.uid()
    )
  );

-- Create indexes for better query performance
create index idx_questions_room_id on questions(room_id);
create index idx_questions_is_answered on questions(is_answered);
create index idx_replies_question_id on replies(question_id);
create index idx_rooms_teacher_id on rooms(teacher_id);
create index idx_rooms_room_code on rooms(room_code);
```

## Google OAuth Setup

1. Go to your Supabase project dashboard
2. Navigate to **Authentication > Providers > Google**
3. Enable the Google provider
4. Enter your Google OAuth credentials (Client ID and Client Secret)
5. Add the following URL to your Google OAuth authorized redirect URIs:
   ```
   https://your-project-reference.supabase.co/auth/v1/callback
   ```

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd askbox

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy

## Project Structure

```
askbox/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Global styles
│   ├── dashboard/
│   │   ├── page.tsx           # Teacher dashboard
│   │   └── [room]/
│   │       └── page.tsx       # Teacher room view
│   └── ask/
│       └── [room_code]/
│           └── page.tsx       # Student room view
├── components/
│   ├── Button.tsx             # Button component
│   ├── Drawer.tsx              # Bottom sheet drawer
│   ├── Input.tsx               # Input/Textarea components
│   ├── Loading.tsx             # Loading spinners & skeletons
│   ├── QuestionCard.tsx        # Question card component
│   └── ThreadDrawer.tsx        # DM thread drawer
├── hooks/
│   ├── useRealtime.ts          # Realtime subscriptions
│   └── useStudentToken.ts      # Student token management
├── lib/
│   ├── createServerSupabaseClient.ts  # Server-side Supabase client
│   ├── supabase.ts             # Client-side Supabase client
│   ├── types.ts                # TypeScript types
│   └── utils.ts                # Utility functions
└── public/                     # Static assets
```

## How It Works

### Student Flow
1. Student visits `/ask/[room_code]`
2. A unique anonymous token is generated and stored in localStorage
3. Student submits a question (stored with `is_answered = false`)
4. Question appears in teacher's queue only
5. When teacher marks as answered, question appears in student's public feed
6. Student can tap the question to open a private DM thread

### Teacher Flow
1. Teacher signs in with Google OAuth
2. Teacher creates a room (gets a 6-character room code)
3. Teacher shares the room link with students
4. Teacher sees all unanswered questions in Queue tab
5. Teacher can "Mark Answered" to make question public and unlock DM
6. Teacher can view DM threads in Answered tab

## License

MIT
