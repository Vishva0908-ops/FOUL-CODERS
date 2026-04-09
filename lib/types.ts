export interface Teacher {
  id: string;
  email: string;
  name: string;
}

export interface Room {
  id: string;
  teacher_id: string;
  name: string;
  room_code: string;
}

export interface Question {
  id: string;
  room_id: string;
  student_token: string;
  question_text: string;
  is_answered: boolean;
  created_at: string;
}

export interface Reply {
  id: string;
  question_id: string;
  student_token: string;
  sender: "student" | "teacher";
  message: string;
  created_at: string;
}

export interface QuestionWithToken extends Question {
  anon_id: string;
}

export function generateAnonId(token: string): string {
  return `Anon#${token.slice(0, 4).toLowerCase()}`;
}
