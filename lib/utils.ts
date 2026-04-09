export function generateAnonId(token: string): string {
  return `Anon#${token.slice(0, 4).toLowerCase()}`;
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateStudentToken(): string {
  return crypto.randomUUID();
}
