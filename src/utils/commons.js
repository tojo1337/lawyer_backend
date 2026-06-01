import { UserModel } from "../model/user.model.js";

export async function findUserFromEmail(email) {
  try {
    const userObj = await UserModel.find({ email }).lean();
    return userObj || [];
  } catch (err) {
    throw err;
  }
}
