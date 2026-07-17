const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");
const eventBus = require("../events/eventBus");

// ─── POST /api/certificates ────────────────────────────────────────────────
router.post("/", auth, async (req, res) => {
  try {
    const { title, issuer, issueDate, expiryDate, credentialId, credentialUrl, imageUrl, skills } = req.body;
    
    if (!title || !issuer) {
      return res.status(400).json({ message: "Title and issuer are required." });
    }

    const certRef = db.collection("certificates").doc();
    const cert = {
      certificateId: certRef.id,
      ownerUid: req.user.id,
      title,
      issuer,
      issueDate: issueDate || null,
      expiryDate: expiryDate || null,
      credentialId: credentialId || "",
      credentialUrl: credentialUrl || "",
      imageUrl: imageUrl || "",
      verified: false,
      skills: skills || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await certRef.set(cert);

    // Emit event
    eventBus.emit("CERTIFICATE_ADDED", { uid: req.user.id, certificateData: cert });

    res.status(201).json(cert);
  } catch (err) {
    console.error("Create certificate error:", err);
    res.status(500).json({ message: "Failed to create certificate." });
  }
});

// ─── GET /api/certificates ─────────────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const snapshot = await db.collection("certificates")
      .where("ownerUid", "==", req.user.id)
      .orderBy("createdAt", "desc")
      .get();
      
    const certificates = snapshot.docs.map(doc => doc.data());
    res.json(certificates);
  } catch (err) {
    console.error("Get certificates error:", err);
    res.status(500).json({ message: "Failed to load certificates." });
  }
});

// ─── PUT /api/certificates/:id ─────────────────────────────────────────────
router.put("/:id", auth, async (req, res) => {
  try {
    const certRef = db.collection("certificates").doc(req.params.id);
    const doc = await certRef.get();
    
    if (!doc.exists || doc.data().ownerUid !== req.user.id) {
      return res.status(404).json({ message: "Certificate not found." });
    }
    
    if (doc.data().verified) {
      return res.status(403).json({ message: "Cannot edit a verified certificate." });
    }

    const { title, issuer, issueDate, expiryDate, credentialId, credentialUrl, imageUrl, skills } = req.body;
    
    const updateData = {
      updatedAt: new Date()
    };
    
    if (title !== undefined) updateData.title = title;
    if (issuer !== undefined) updateData.issuer = issuer;
    if (issueDate !== undefined) updateData.issueDate = issueDate;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate;
    if (credentialId !== undefined) updateData.credentialId = credentialId;
    if (credentialUrl !== undefined) updateData.credentialUrl = credentialUrl;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (skills !== undefined) updateData.skills = skills;
    
    await certRef.update(updateData);
    
    const updatedDoc = await certRef.get();
    res.json(updatedDoc.data());
  } catch (err) {
    console.error("Update certificate error:", err);
    res.status(500).json({ message: "Failed to update certificate." });
  }
});

// ─── DELETE /api/certificates/:id ──────────────────────────────────────────
router.delete("/:id", auth, async (req, res) => {
  try {
    const certRef = db.collection("certificates").doc(req.params.id);
    const doc = await certRef.get();
    
    if (!doc.exists || doc.data().ownerUid !== req.user.id) {
      return res.status(404).json({ message: "Certificate not found." });
    }
    
    // We allow deleting verified certificates so students can clean up their profile
    await certRef.delete();
    res.json({ message: "Certificate deleted successfully." });
  } catch (err) {
    console.error("Delete certificate error:", err);
    res.status(500).json({ message: "Failed to delete certificate." });
  }
});

module.exports = router;
