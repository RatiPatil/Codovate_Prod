const express = require('express');
const router = express.Router();

const mockEvents = [
  {
    id: "evt_1",
    title: "Global AI Hackathon 2026",
    date: "2026-08-15T09:00:00Z",
    type: "Hackathon",
    location: "Online",
    organizer: "Codovate Hub",
    description: "Join 5000+ students globally to build the next generation of AI tools. $50,000 in prizes.",
    attendees: 1204
  },
  {
    id: "evt_2",
    title: "Cracking the Coding Interview w/ Google Engineer",
    date: "2026-07-20T18:00:00Z",
    type: "Webinar",
    location: "Zoom",
    organizer: "Career Prep Series",
    description: "Learn how to approach graph algorithms and dynamic programming directly from a Senior L5 SWE at Google.",
    attendees: 432
  },
  {
    id: "evt_3",
    title: "React Native Masterclass",
    date: "2026-07-25T14:00:00Z",
    type: "Workshop",
    location: "Online",
    organizer: "Frontend Masters",
    description: "Build a cross-platform mobile app from scratch in this 3-hour intensive workshop.",
    attendees: 215
  }
];

// GET /api/events
router.get('/', (req, res) => {
  res.json(mockEvents);
});

module.exports = router;
