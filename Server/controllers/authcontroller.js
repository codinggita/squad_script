import usermodel from "../models/usermodel.js";
import { hashPassword, comparePassword } from "../helpers/authhelper.js";
import JWT ,{decode} from "jsonwebtoken";
import nodemailer from "nodemailer";
export const registerController = async (req, res) => {
    try {
        const { username, name, email, password } = req.body;
        if (!username) {
            return res.status(400).send({
                success: false,
                message: "Username is required",
            });
        }
        if (!name) {
            return res.status(400).send({
                success: false,
                message: "Name is required",
            });
        }
        if (!email) {
            return res.status(400).send({
                success: false,
                message: "email is required",
            });
        }
        if (!password) {
            return res.status(400).send({
                success: false,
                message: "Password is required",
            });
        }

        const hashed_password = await hashPassword(password);

        const exist_email = await usermodel.findOne({ email: email });
        if (exist_email) {
            return res.status(409).send({
                success: false,
                message: "User already exists",
            });
        }

        const exist_name = await usermodel.findOne({ username: username });
        if (exist_name) {
            return res.status(409).send({
                success: false,
                message: "Username already exists",
            });
        }

        try {
            const user = await new usermodel({
                name: name,
                email: email,
                username: username,
                password: hashed_password,
            }).save();
            return res.status(201).send({
                success: true,
                message: "user registered successfully",
                user,
            });
        } catch (error) {
            return res.status(500).send({
                success: false,
                message: "Failed to create user",
                error: error,
            });
        }
    } catch (error) {
        return res.status(500).send({
            success: false,
            message: "Error in register API",
            error: error,
        });
    }
};

export const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email) {
            return res.status(400).send({
                success: false,
                message: "Email is required",
            });
        }
        if (!password) {
            return res.status(400).send({
                success: false,
                message: "Password is required",
            });
        }
        const user = await usermodel.findOne({ email: email });
        if (!user) {
            return res.status(404).send({
                success: false,
                message: "No User found",
            });
        }
        const result = await comparePassword(password, user.password);
        if (result) {
            const token = await JWT.sign(
                {
                    _id: user._id,
                },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );
            return res.status(200).send({
                success: true,
                message: "Logged in successfully",
                user: {
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    isVerified: user.isVerified,
                },
                token,
            });
        } else {
            return res.status(401).send({
                success: false,
                message: "Invalid Password",
            });
        }
    } catch (error) {
        return res.status(500).send({
            success: false,
            message: "Failed to login",
        });
    }
};

export const mailcontroller = async (req, res) => {
    try {
        const { email } = req.body;
        var otp = Math.floor(1000 + Math.random() * 1000);
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        const mailoption = {
            from: {
                name: "Squad Script",
                address: process.env.EMAIL,
            },
            to: [email],
            subject: "OTP Verification",
            text: `Dear User,\n Your OTP is ${otp}. Do not share it with anyone by any means. This is confidential and to be used by you only.\n \n Warm regards, \n SquadScript(SS)`,
        };
        const sendMail = async (transporter, mailoption) => {
            try {
                await transporter.sendMail(mailoption);
                const user = await usermodel.findOne({ email });
                if (user) {
                    user.otp = otp;
                    await user.save();
                }
                return res.status(200).send({
                    success: true,
                    message: "email has been Sent",
                });
            } catch (error) {
                return res.status(500).send({
                    success: false,
                    message: "Failed to send mail",
                    error,
                });
            }
        };
        sendMail(transporter, mailoption);
    } catch (error) {
        return res.status(400).send({
            success: false,
            message: "Error in mail api",
            error,
        });
    }
};

export const verifyotpcontroller = async (req, res) => {
    try {
        const { email, otp } = req.body;
        let user = await usermodel.findOne({ email: email });
        if (!user) {
            return res.status(404).send({
                success: false,
                message: "No user found",
            })
        }
        if (otp == user.otp) {
            user.isVerified = true
            user.lastVerified = Date.now();
            await user.save();
            return res.status(200).send({
                success: true,
                message: "Verified successfully",
            })
        }
        else {
            return res.status(401).send({
                success: false,
                message: "Wrong OTP"
            })
        }
    } catch (error) {
        return res.status(500).send({
            success: false,
            message: "Error in verify otp controller"
        })
    }
}

export const forgotpasswordcontroller = async (req, res) => {
    try {
        const { email } = req.body;
        var user = await usermodel.findOne({ email: email });
        if (user) {
            var otp = Math.floor(1000 + Math.random() * 1000);
            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD,
                },
            });

            const mailoption = {
                from: {
                    name: "Squad Script",
                    address: process.env.EMAIL,
                },
                to: [email],
                subject: "OTP Verification",
                text: `Dear User,\n Your OTP to reset password is ${otp}. Do not share it with anyone by any means. This is confidential and to be used by you only.\n \n Warm regards, \n SquadScript(SS)`,
            };
            const sendMail = async (transporter, mailoption) => {
                try {
                    await transporter.sendMail(mailoption);
                    const user = await usermodel.findOne({ email });
                    if (user) {
                        user.otp = otp;
                        user.save();
                    }
                    return res.status(200).send({
                        success: true,
                        message: "email has been Sent",
                    });
                } catch (error) {
                    return res.status(400).send({
                        success: false,
                        message: "Failed to send mail",
                        error,
                    });
                }
            };
            sendMail(transporter, mailoption);
        }
        else {
            return res.status(404).send({
                success: false,
                message: "no user found",
            })
        }
    } catch (error) {
        return res.status(500).send({
            success: false,
            message: "error in forgot password api"
        })
    }
}

export const getpasswordcontroller = async (req, res) => {
    try {
        const { success } = req.params;
        const {email}=req.body;
        if (success) {
            const { password } = req.body;
            let user = await usermodel.findOne({ email });
            if (user) {
                try {
                    const hashed_password = await hashPassword(password);
                    user.password = hashed_password;
                    user.otp = null;
                    await user.save();
                    return res.status(200).send({
                        success: true,
                        message: "Password changed successfully",
                    })
                }
                catch (e) {
                    return res.status(500).send({
                        success: false,
                        message: "Error in changing password",
                    })
                }
            }
            else {
                return res.status(404).send({
                    success: false,
                    message: 'No user found',
                })
            }
        }
    } catch (error) {
        return res.status(500).send({
            success: false,
            message: "error in get password api"
        })
    }
}

export const changepasswordcontroller = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await usermodel.findOne({ email });
        if (user) {
            var result = await comparePassword(password, user.password);
            if (result) {
                return res.status(200).send({
                    success: true,
                    message: "user can change password"
                })
            }
            else {
                return res.status(200).send({
                    success: false,
                    message: "wrong password"
                })
            }
        }
        else {
            return res.status(200).send({
                success: false,
                message: "no such user"
            })
        }
    } catch (error) {
        res.status(400).send({
            success: false,
            message: "error in change password api",
            error
        })
    }
}

export const verifychangepasswordcontroller = async (req, res) => {
    try {
        const { success } = req.params;
        if (success) {
            const { newPassword, confirmPassword, email } = req.body;
            const user = await usermodel.findOne({ email });
            if (user) {
                if (newPassword === confirmPassword) {
                    const hashed_password = await hashPassword(newPassword);
                    user.password = hashed_password;
                    user.otp = null;
                    await user.save();
                    return res.status(200).send({
                        success: true,
                        message: "password changed successfully",
                    })
                }
                else {
                    return res.status(200).send({
                        success: false,
                        message: "password do not match",
                    })
                }
            }
            else {
                return res.status(400).send({
                    success: false,
                    message: "no such user"
                })
            }
        }
    }
    catch (e) {
        return res.status(400).send({
            success: false,
            message: "error in verify change password api"
        })
    }
}
export const contactcontroller = async(req,res) => {
    try {
        const {email,content,type} = req.body;
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        const mailoption = {
            from: {
                name: "Squad Script",
                address: process.env.EMAIL,
            },
            to: [process.env.DEV1,process.env.DEV2],
            subject: `Message from user ${email} from squad script`,
            text: `Dear Developer,\nWe have recieved a contact message of type: ${type} from user: ${email}.\nThe message sent is as follows:\n${content}.\n \n Warm regards, \n SquadScript(SS)`,
        };
        const sendMail = async (transporter, mailoption) => {
            try {
                await transporter.sendMail(mailoption);
                const user = await usermodel.findOne({ email });
                if (user) {
                    user.otp = otp;
                    user.save();
                }
                return res.status(200).send({
                    success: true,
                    message: "Mail has been Sent",
                });
            } catch (error) {
                return res.status(400).send({
                    success: false,
                    message: "Failed to send mail",
                    error,
                });
            }
        };
        sendMail(transporter, mailoption);
    } catch (error) {
        return res.status(500).send({
            success:false,
            message: "Error in contact api"
        })
    }
}

export const islogincontroller = async(req,res) => {
    try {
        const token = req.headers.authorization;
        const {name,email,username} = req.body;
        if(!token){
            return res.status(401).send({
                success:false,
                message:"No JWT Token Provided"
            })
        }
        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        const user = await usermodel.findOne({ _id: decoded._id });
        if(!user){
            return res.status(404).send({
                success:false,
                message:"User not found"
            })
        }
        if(!name && !email && !username) {
            return res.status(200).send({
                success:true,
                message:"user found successfully",
                data:[user.username, user.name, user.email, user.isVerified]
            })
        }
        else{
            if (name && name!==user.name) user.name=name;
            if (email && email!==user.email) {
                user.email=email;
                user.isVerified=false;
                user.lastVerified=Date.now();
            }
            if (username && username!==user.username) user.username=username;
            await user.save();
            return res.status(200).send({
                success:true,
                message:"user updated successfully",
                data:[user.username, user.name, user.email, String(user.isVerified)]
            })
        }
    } catch (error) {
        console.error(error); // Log the error
        return res.status(500).send({
            success:false,
            message:"An error occurred"
        })
    }
};
export const deleteusercontroller = async(req,res) => {
    try {
        const token = req.headers.authorization;
        const userid = decode(token)._id;
        const user = await usermodel.deleteOne({_id:userid});
        if (user.deletedCount == 1)
        return res.status(200).send({
            success:true,
            message:"User deleted successfully"
        })
        return res.status(200).send({
            success:false,
            message:"user not deleted successfully"
        })
    } catch (error) {
        return res.status(400).send({
            success:false,
            message:"error in delete user api"
        })
    }
}