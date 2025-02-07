import * as bcrypt from 'bcrypt';

const validate = (password: string, confirmPassword: string): boolean => {
  if (password !== confirmPassword) {
    return false;
  }

  if (password.length < 8) {
    return false;
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return false;
  }

  return true;
};

const hash = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  const value = await bcrypt.hash(password, salt);

  return value;
};

const compare = async (password: string, hashedValue: string): Promise<boolean> => {
  const isPasswordCorrect = await bcrypt.compare(password, hashedValue);

  return isPasswordCorrect;
};

export default {
  validate,
  hash,
  compare,
};
