const { mongoose } = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        profilePicture: {
            type: String,
            default:
                'https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg',
        },
        resetToken: String,
        resetTokenExpiration: Date,
    },
    { timestamps: true }
);

userSchema.pre('save', function(next) {
    if (this.resetTokenExpiration && this.resetTokenExpiration < Date.now()) {
        this.resetToken = undefined;
        this.resetTokenExpiration = undefined;
    }
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;