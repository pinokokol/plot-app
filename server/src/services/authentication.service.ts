import { User } from "../entities/user.entity";
import { JwtPayload } from "jsonwebtoken";

import jwtUtil from "../utils/jwt.util";
import passwordUtil from "../utils/password.util";
import databaseService from "./database.service";

const login = async (
  email: string,
  password: string
): Promise<string | null> => {
  const user = await databaseService
    .database()
    .getRepository(User)
    .findOne({ where: { email }, select: ["password", "id"] });

  if (!user) {
    return null;
  }

  const isPasswordCorrect = await passwordUtil.compare(password, user.password);

  if (!isPasswordCorrect) {
    return null;
  }

  const accessToken = jwtUtil.generateAccessToken(user.id);

  return accessToken;
};

const register = async (
  email: string,
  password: string,
  access: ("full" | "parkingPlace")[]
): Promise<boolean> => {
  return databaseService.database().transaction(async (transaction) => {
    const user = await transaction.getRepository(User).findOne({
      where: [{ email }],
    });

    if (user) {
      throw new Error("User already exists");
    }

    const data = await transaction.getRepository(User).save({
      email,
      password: await passwordUtil.hash(password),
      accessRequested: access,
      role: access.includes("full") ? "admin" : "user",
      accessGranted: [],
    });

    if (!data) {
      throw new Error("User not created");
    }

    return true;
  });
};

const generateResetToken = async (email: string): Promise<string | null> => {
  const user = await databaseService
    .database()
    .getRepository(User)
    .findOne({ where: { email } });

  if (!user) {
    return null;
  }

  const resetToken = jwtUtil.generateResetToken(user.id);

  return resetToken;
};

const verifyToken = async (token: string): Promise<string | null> => {
  const verification = jwtUtil.verifyToken(token);
  return verification;
};

const updatePassword = async (
  userId: number,
  password: string
): Promise<boolean> => {
  return databaseService.database().transaction(async (transaction) => {
    const userEntity = await transaction.getRepository(User).findOne({
      where: { id: userId },
    });

    if (!userEntity) {
      throw new Error("User not found");
    }

    userEntity.password = await passwordUtil.hash(password);

    await transaction.getRepository(User).save(userEntity);

    return true;
  });
};

const checkOldPassword = async (
  user_id: number,
  old_password: string
): Promise<boolean> => {
  const user = await databaseService
    .database()
    .getRepository(User)
    .findOne({ where: { id: user_id }, select: ["password"] });

  if (!user) {
    return false;
  }

  const isPasswordCorrect = await passwordUtil.compare(
    old_password,
    user.password
  );

  return isPasswordCorrect;
};

const getUserMiddleware = async (
  decodedToken: string | JwtPayload | any
): Promise<User | null> => {
  return await databaseService
    .database()
    .getRepository(User)
    .findOne({
      where: { id: decodedToken["uid"] },
    });
};

export default {
  login,
  register,
  getUserMiddleware,
  generateResetToken,
  verifyToken,
  updatePassword,
  checkOldPassword,
};
