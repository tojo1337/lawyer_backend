import Razorpay from "razorpay";
import { appConfig } from "./app.config.js";

// Singleton class pattern
class RazorpayInstance {
  static instance = null;
  #razorpay = null;
  constructor() {
    if (RazorpayInstance.instance) {
      return RazorpayInstance.instance;
    }

    // Declare an instance
    this.#razorpay = new Razorpay({
      key_id: appConfig.razorpayId,
      key_secret: appConfig.razorpaySecrets,
    });

    // Attach it to the class
    RazorpayInstance.instance = this;
  }

  get razorpay() {
    return this.#razorpay;
  }
}

const classInst = new RazorpayInstance();
export const gateway = classInst.razorpay;
