const bcryptjs = require('bcryptjs')
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const config = require("../config/config");
const errorHandler = require('../utils/errorHandler')
const z = require('zod');

const registrationSchema = z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"
      ),
    confirmPassword: z.string().min(6),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters")
});
const googleSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    profilePicture: z.string(),
});

exports.register = async (req, res, next) => {
    try {
        const { username, email, password, confirmPassword } = registrationSchema.parse(req.body);

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            const field = existingUser.email === email ? 'Email' : 'Username';
            return next(errorHandler(401, `${field} is already taken`));
        }
        if (password !== confirmPassword) {
            return next(errorHandler(401, `Password and confirm password do not match`));
        }
        const hashedPassword = bcryptjs.hashSync(password, 10);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return next(errorHandler(400, error.errors.map(err => err.message)));
        }
        next(error)
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await User.findOne({ email });
        if (!user) {
            return next(errorHandler(404, 'User Not Found'))
        }
        const passwordMatch = bcryptjs.compareSync(password, user.password);
        if (!passwordMatch) {
            return next(errorHandler(401, 'wrong credentials'));
        }

        const token = jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: '1h' });
        const { password: hashedPassword, ...rest } = user._doc;
        const expiryDate = new Date(Date.now() + 3600000);
        res
            .cookie('access_token', token, { httpOnly: true, expires: expiryDate })
            .status(200)
            .json(rest);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return next(errorHandler(400, error.errors.map(err => err.message)));
        }
        next(error)
    }
};

exports.google = async (req, res,next) => {
    try {
        console.log(req.body)
        const { name, email, profilePicture } = googleSchema.parse(req.body);
        const user = await User.findOne({ email });
        if (user) {
            const token = jwt.sign({ id: user._id }, config.jwtSecret);
            const { password: hashedPassword, ...rest } = user._doc;
            const expiryDate = new Date(Date.now() + 3600000);
            return res
                .cookie('access_token', token, {
                    httpOnly: true,
                    expires: expiryDate,
                })
                .status(200)
                .json(rest);
        }
        
        const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
        const newUser = new User({
            username: name.split(' ').join('').toLowerCase() + Math.random().toString(36).slice(-8),
            email,
            password: hashedPassword,
            profilePicture: profilePicture,
        });
        await newUser.save();

        const token = jwt.sign({ id: newUser._id }, config.jwtSecret);
        const { password: hashedPassword2, ...rest } = newUser._doc;
        const expiryDate = new Date(Date.now() + 3600000);
        res
            .cookie('access_token', token, {
                httpOnly: true,
                expires: expiryDate,
            })
            .status(200)
            .json(rest);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return next(errorHandler(400, error.errors.map(err => err.message)));
        }
        next(error);
    }
}

exports.logout = (req, res) => {
    res.clearCookie('access_token').status(200).json('Signout success!');
}