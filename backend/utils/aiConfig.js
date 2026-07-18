const { db } = require('../config/firebase');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const getConfiguredModel = async () => {
  if (!genAI) throw new Error("GEMINI_API_KEY is not configured.");
  
  let modelName = "gemini-2.5-flash";
  let temperature = 0.7;
  
  try {
    const doc = await db.collection('platform_settings').doc('global_config').get();
    if (doc.exists) {
      const data = doc.data();
      if (data.ai_model) modelName = data.ai_model;
      if (data.ai_temperature !== undefined) temperature = parseFloat(data.ai_temperature);
    }
  } catch (error) {
    console.warn("Failed to fetch AI settings, falling back to defaults.", error);
  }
  
  return genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      temperature: temperature
    }
  });
};

module.exports = { getConfiguredModel, genAI };
