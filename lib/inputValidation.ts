const INJECTION_PATTERNS = [
  // Direct override attempts
  /ignore\s+(previous|above|all|prior|earlier|your)/i,
  /forget\s+(previous|your|the\s+above)/i,
  /disregard/i,
  /override/i,
  /bypass/i,

  // Role manipulation
  /you\s+are\s+(now|a)\b/i,
  /act\s+(as|like)\b/i,
  /pretend\s+(you|to\s+be)/i,
  /roleplay\s+as/i,
  /become\s+a\b/i,

  // Instruction injection
  /new\s+(instruction|task|prompt|context|role)/i,
  /system\s+prompt/i,
  /from\s+now\s+on/i,
  /instead\s+of/i,

  // Jailbreak keywords
  /jailbreak/i,
  /do\s+anything\s+now/i,
  /dan\s+mode/i,
  /developer\s+mode/i,
  /unrestricted\s+mode/i,

  // Thai patterns
  /ลืมคำสั่ง/,
  /เปลี่ยนบทบาท/,
  /คำสั่งใหม่/,
  /ละเว้นคำสั่ง/,
  /ไม่ต้องสนใจ/,
];

export const MAX_LENGTHS = {
  position: 500,
  skills: 500,
  qualifications: 500,
  chatMessage: 2000,
};

export function detectInjection(input: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

export function validateField(
  value: string,
  field: keyof typeof MAX_LENGTHS
): string | null {
  if (value.length > MAX_LENGTHS[field]) {
    return `Input is too long (maximum ${MAX_LENGTHS[field]} characters)`;
  }
  if (detectInjection(value)) {
    return "Invalid pattern detected. Please check your input.";
  }
  return null;
}
