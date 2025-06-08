

const Validation ={

    // Password Validation function
    passwordValidation: function (password) {
        const minLength = 8;
        const maxLength = 16;

        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const isValidLength = password.length >= minLength && password.length <= maxLength;

        const errors = [];

        if (!isValidLength) errors.push(`Password must be ${minLength}-${maxLength} characters long.`);
        if (!hasUpperCase) errors.push("Password must contain at least one uppercase letter.");
        if (!hasLowerCase) errors.push("Password must contain at least one lowercase letter.");
        if (!hasNumber) errors.push("Password must contain at least one number.");
        if (!hasSpecialChar) errors.push("Password must contain at least one special character (!@#$%^&*...).");

        if (errors.length > 0) {
            return { valid: false, errors };
        }

        return { valid: true, errors: [] };
    },

    // username Validation function
    usernameValidation: function (username) {
        const minLength = 4;
        const maxLength = 16;
        const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;

        const errors = [];

        if (username.length < minLength || username.length > maxLength) {
            errors.push(`Username must be between ${minLength}-${maxLength} characters.`);
        }

        if (!usernameRegex.test(username)) {
            errors.push("Username can only contain letters, numbers, and underscores (_), and must start with a letter.");
        }

        if (errors.length > 0) {
            return { errors }; // ✅ Rejects with an error
        }

        return 0;

    },

}

export default Validation;