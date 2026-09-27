const { db } = require("../config/firebase");

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

/**
 * Validates that the current session token (if managed in DB) is still active.
 * 
 * In a fully stateless JWT architecture, this is optional, but for enterprise
 * we check if the session was explicitly revoked in the DB.
 */
const sessionValidation = async (req, res, next) => {
  try {
    // If authenticate middleware didn't find a user, skip
    if (!req.user) return next();

    // The access token is valid, but let's check if the user's lifecycle allows access
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({ message: "User account no longer exists." });
    }

    const userData = mapDoc(userDoc);
    
    if (userData.lifecycle !== 'ACTIVE') {
      return res.status(403).json({ 
        message: "Account is not active.", 
        lifecycle: userData.lifecycle 
      });
    }

    // Attach full DB user data for downstream use
    req.dbUser = userData;
    
    next();
  } catch (error) {
    console.error("[Session Validation Error]", error);
    res.status(500).json({ message: "Internal server error during session validation." });
  }
};

module.exports = sessionValidation;
