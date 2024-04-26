const bcryptjs = require('bcryptjs')
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const config = require("../config/config");
const errorHandler = require('../utils/errorHandler')

const cookieOptions = {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'none',
    secure: config.isProduction,
};

exports.register = async (req, res, next) => {
    try {
        const { username,email, password } = req.body;

        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            return next(errorHandler(401, 'User already exists')) 
        }

        const newUser = new User({
            username,
            email, 
            password,
        });
        await newUser.save(); 
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        next(error)
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return next(errorHandler(404, 'User Not Found'))
        }

        const passwordMatch = bcryptjs.compareSync(password, user.password);
        if (!passwordMatch) {
            return next(errorHandler(401, 'wrong credentials'));
        }

        const token = jwt.sign({ id: user._id }, config.jwtSecret);
        const { password: hashedPassword, ...rest } = validUser._doc;


        // const payload = {
        //     user: {
        //         userId: user._id,
        //         email: user.email
        //     }
        // };

        // jwt.sign(payload, config.jwtSecret, { expiresIn: '1d' }, async (err, token) => {
        //     if (err) throw err;
        //     await User.updateOne({ _id: user._id }, {
        //         $set: { token }
        //     })
        //     user.save();
        //     res.cookie('token', token, cookieOptions).json({
        //         id: user._id,
        //     });
        // });

    } catch (error) {
        next(error);
    }
};

exports.logout = (req, res) => {
    res.cookie('token', '', { sameSite: 'none', secure: true }).json('ok');
}