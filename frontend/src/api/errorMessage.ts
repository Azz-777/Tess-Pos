import axios from 'axios';

export function getErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<{ error?: string }>(error)) return fallback;

  const serverMessage = error.response?.data?.error;
  if (serverMessage) return serverMessage;

  if (error.code === 'ERR_NETWORK') {
    return 'Serverga ulanib bo‘lmadi. Backend va MongoDB ishlayotganini tekshiring (docker compose up --build).';
  }

  return fallback;
}
