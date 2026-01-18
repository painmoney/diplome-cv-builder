export function isEmailValid(email) {
  return /\S+@\S+\.\S+/.test(email);
}

export function isPasswordValid(password) {
  return password.length >= 6;
}
