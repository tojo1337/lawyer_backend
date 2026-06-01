import mongoose from "mongoose";
import { UserModel } from "../model/user.model.js";

export async function findUserByEmail(email) {
  try {
    const userObj = await UserModel.find({ email }).lean();
    return userObj || [];
  } catch (err) {
    throw err;
  }
}

export async function findUserById(id) {
  try {
    const userObj = await UserModel.find({
      _id: new mongoose.Types.ObjectId(id),
    }).lean();
    return userObj || [];
  } catch (err) {
    throw err;
  }
}
