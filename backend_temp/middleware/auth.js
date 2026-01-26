// Basic authentication middleware for protected routes
// Accepts wallet address as token for now (can be upgraded to JWT later)
export default function auth(req, res, next) {
  // Get wallet address from Authorization header
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  // Validate wallet address format (0x followed by 40 hex characters)
  const walletAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  
  // If token looks like a wallet address, use it directly
  // Otherwise, it could be a JWT token (for future implementation)
  if (walletAddressRegex.test(token)) {
    req.user = { address: token.toLowerCase() };
  } else {
    // For now, if it's not a valid wallet address, reject
    // In the future, this could verify a JWT token
    return res.status(401).json({ 
      error: 'Unauthorized: Invalid token format. Expected wallet address (0x...)' 
    });
  }
  
  next();
}
