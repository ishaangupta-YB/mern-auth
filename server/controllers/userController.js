const bcryptjs = require('bcryptjs')
const User = require("../models/user");
const errorHandler = require('../utils/errorHandler')
const z = require('zod');

const updateUserSchema = z.object({
    username: z.string().min(3).max(30).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6, "Password must be at least 6 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
            "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"
        ).optional(),
    profilePicture: z.string().optional(),
});

exports.updateUser = async (req, res, next) => {
    if (req.user.id !== req.params.id) {
        return next(errorHandler(401, 'You can update only your account!'));
    }
    try {
        const { username, email, password, profilePicture } = updateUserSchema.parse(req.body);

        const existingUser = await User.findOne({ $and: [{ _id: { $ne: req.params.id } }, { $or: [{ username }, { email }] }] });
        if (existingUser) {
            const takenFields = [];
            if (existingUser.username === username) takenFields.push('username');
            if (existingUser.email === email) takenFields.push('email');
            return next(errorHandler(409, `The following field(s) are already taken: ${takenFields.join(', ')}`));
        }

        if (password) {
            req.body.password = bcryptjs.hashSync(req.body.password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    username,
                    email,
                    password: req.body.password,
                    profilePicture,
                },
            },
            { new: true }
        );
        const { password: hashedPassword, ...rest } = updatedUser._doc;
        res.status(200).json(rest);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return next(errorHandler(400, error.errors.map(err => err.message)));
        }
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    if (req.user.id !== req.params.id) {
        return next(errorHandler(401, 'You can delete only your account!'));
    }
    try {
        const result = await User.findByIdAndDelete(req.params.id);
        if(!result) return next(errorHandler(401, 'You can delete only your account!')); 
        res.status(200).clearCookie('access_token').json({ message: "User has been deleted..." });
    } catch (error) {
        next(error);
    }
}