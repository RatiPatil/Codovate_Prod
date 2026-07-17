const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PROBLEMS = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.
You can return the answer in any order.`,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' }
    ],
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  // Write your code here\n}`,
      python: `def twoSum(nums, target):\n    # Write your code here\n    pass`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n    }\n}`
    }
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    tags: ['String', 'Stack'],
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.`,
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' }
    ],
    starterCode: {
      javascript: `function isValid(s) {\n  // Write your code here\n}`,
      python: `def isValid(s):\n    # Write your code here\n    pass`,
      java: `class Solution {\n    public boolean isValid(String s) {\n        // Write your code here\n    }\n}`
    }
  },
  {
    id: 'longest-substring',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    tags: ['String', 'Sliding Window'],
    description: `Given a string \`s\`, find the length of the longest substring without repeating characters.`,
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' }
    ],
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {\n  // Write your code here\n}`,
      python: `def lengthOfLongestSubstring(s):\n    # Write your code here\n    pass`,
      java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your code here\n    }\n}`
    }
  }
];

// GET /api/coding/problems
router.get('/problems', (req, res) => {
  res.json(PROBLEMS);
});

// GET /api/coding/problems/:id
router.get('/problems/:id', (req, res) => {
  const problem = PROBLEMS.find(p => p.id === req.params.id);
  if (problem) res.json(problem);
  else res.status(404).json({ message: 'Problem not found' });
});

// POST /api/coding/submit
// Evaluates the code using Gemini
router.post('/submit', async (req, res) => {
  const { problemId, code, language } = req.body;
  const problem = PROBLEMS.find(p => p.id === problemId);
  
  if (!problem || !code) {
    return res.status(400).json({ message: "Invalid request parameters" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
You are an expert technical interviewer and code evaluator.
The user has submitted code for the problem: "${problem.title}".

Problem Description:
${problem.description}

User's Code (${language}):
\`\`\`${language}
${code}
\`\`\`

Evaluate the code on the following criteria:
1. Syntax & Compilation: Does the code have syntax errors?
2. Correctness: Does it solve the problem logically for the standard edge cases?
3. Complexity: What is the Time and Space complexity?

Respond ONLY with a JSON object in this exact format (no markdown code blocks, just raw JSON):
{
  "passed": true/false,
  "syntaxError": "Describe any syntax errors, or null if none",
  "feedback": "A concise paragraph explaining what is good or what failed.",
  "timeComplexity": "e.g., O(n)",
  "spaceComplexity": "e.g., O(1)"
}
`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Clean potential markdown blocks
    let jsonStr = text;
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();
    
    const evalResult = JSON.parse(jsonStr);
    res.json(evalResult);
    
  } catch (error) {
    console.error("AI Evaluation error:", error);
    res.status(500).json({ message: "Failed to evaluate code. " + error.message });
  }
});

module.exports = router;
