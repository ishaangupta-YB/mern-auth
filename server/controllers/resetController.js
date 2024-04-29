const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs')
const User = require('../models/user');
const nodemailer = require("nodemailer");
const config = require('../config/config');
const z = require('zod');

const transporter = nodemailer.createTransport({
    service: "your-email-service-provider",
    auth: {
        user: "your-email@example.com",
        pass: "your-email-password",
    },
});

const resetPasswordSchema = z.object({
    resetToken: z.string().min(1, "Reset token is required"),
    newPassword: z.string()
        .min(6, "Password must be at least 6 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"),
});

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address").min(1, "Email is required"),
});


const sendPasswordResetEmail = async (email, resetToken) => {
    const resetLink = `${config.clientURL}/reset-password/${resetToken}`;
    console.log(resetLink)
    const mailOptions = {
        from: "your-email@example.com",
        to: email,
        subject: "Password Reset",
        html: `
          <p>Click the following link to reset your password:</p>
          <a href="${resetLink}">${resetLink}</a>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw error;
    }
};


exports.validateResetToken = async (req, res, next) => {
    const { resetToken } = req.params;
    try {
        const decodedToken = jwt.verify(resetToken, config.jwtSecret);

        if (decodedToken.exp < Date.now() / 1000) {
            return next(errorHandler(400, `Expired reset token`));
        }

        const user = await User.findOne({ _id: decodedToken.userId, resetToken });
        if (!user) {
            next(errorHandler(404, `Invalid reset token`));
        }

        res.status(200).json({ message: 'Valid reset token' });
    } catch (error) {
        next(error)
    }

}

exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        forgotPasswordSchema.parse({ email });
        const user = await User.findOne({ email });
        if (!user) {
            return next(errorHandler(404, `User not found`));
        }
        const resetToken = jwt.sign({ userId: user._id }, config.jwtSecret, {
            expiresIn: "10m",
        });

        user.resetToken = resetToken;
        user.resetTokenExpiration = new Date(Date.now() + 600000);
        await user.save()

        await sendPasswordResetEmail(email, resetToken);

        res.status(200).json({ message: "Password reset email sent successfully. Check Your Inbox." });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return next(errorHandler(400, error.errors.map(err => err.message)));
        }
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { resetToken, newPassword } = req.body;
        resetPasswordSchema.parse({ resetToken, newPassword });
        let decodedToken;
        try {
            decodedToken = jwt.verify(resetToken, config.jwtSecret);
        } catch (tokenError) {
            return next(errorHandler(400, `Invalid reset token`));
        }

        if (!decodedToken || !decodedToken.userId || decodedToken.exp < Date.now() / 1000) {
            return next(errorHandler(400, `Expired reset token`));
        }
        const user = await User.findOne({ _id: decodedToken.userId, resetToken });
        if (!user) {
            return next(errorHandler(400, `User not found`));
        }

        const hashedPassword = bcryptjs.hashSync(newPassword, 10);

        user.password = hashedPassword
        delete user.resetToken
        delete user.resetTokenExpiration

        await user.save();
        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(err => err.message) });
        }
        next(error);
    }
};