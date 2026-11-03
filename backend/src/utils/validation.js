const validator = require("validator");

const validateSignupData = ({ name, email, password }) => {
    if (!name || !email || !password) {
        throw new Error("All fields are required");
    }

    if (!validator.isEmail(email)) {
        throw new Error("Invalid email address format");
    }

    if (!validator.isStrongPassword(password)) {
        throw new Error("Password is not strong enough");
    }
};

const validateLoginData = ({ email, password }) => {
    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    if (!validator.isEmail(email)) {
        throw new Error("Invalid email address format");
    }
};

module.exports = {
    validateSignupData,
    validateLoginData,
};
