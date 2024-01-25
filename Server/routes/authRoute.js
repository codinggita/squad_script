import express from 'express'
import { forgotpasswordcontroller, loginController, mailcontroller, registerController, verifyotpcontroller, getpasswordcontroller,changepasswordcontroller, verifychangepasswordcontroller } from '../controllers/authcontroller.js';
const router=express.Router();
router.post("/register",registerController);
router.post("/login",loginController);
router.post("/sendotp",mailcontroller);
router.post("/verifyotp",verifyotpcontroller);
router.post("/forgotpassword",forgotpasswordcontroller);
router.post("/recievepassword/:success",getpasswordcontroller);
router.post("/changepassword",changepasswordcontroller);
router.post("/verifychangepassword/:success",verifychangepasswordcontroller);
export default router;