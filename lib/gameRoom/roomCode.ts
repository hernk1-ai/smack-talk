const ROOM_CODE_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const ROOM_CODE_LENGTH = 9;

export function generateRoomCode() {
  const bytes = new Uint8Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => ROOM_CODE_ALPHABET[byte % ROOM_CODE_ALPHABET.length]).join("");
}

export function isValidRoomCode(value: string) {
  return /^[a-z0-9]{8,10}$/.test(value);
}

export function buildPrivateRoomPath(gameId: string, roomCode: string) {
  return `/game/${gameId}/room/${roomCode}`;
}
