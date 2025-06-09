import jwt from "jsonwebtoken";


const jwtAuthMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;
    // Check if token is present in the Authorization header or cookies

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        return res.status(400).json({ message: "Invalid token." });
    }
}

export default jwtAuthMiddleware;
// This middleware checks for a JWT token in the request headers, verifies it, and attaches the user information to the request object.