const CODING_PROBLEMS = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    type: 'daily', // daily, weekly, practice
    difficulty: 'Easy',
    topic: 'DSA',
    tags: ['Array', 'Hash Table'],
    companies: ['Google', 'Amazon', 'Facebook', 'Microsoft'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.
You can return the answer in any order.`,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
    ],
    hints: [
      "A brute force approach would be to check every pair, but that takes O(n^2) time.",
      "Can we use extra space to keep track of values we've seen so far?",
      "Use a hash map where the key is the number and the value is its index. As you iterate through the array, check if (target - current_number) exists in the hash map."
    ],
    solution: `The optimal approach is to use a Hash Map. 
Time Complexity: O(n)
Space Complexity: O(n)

\`\`\`javascript
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}
\`\`\`
`,
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  // Write your code here\n}`,
      python: `def twoSum(nums, target):\n    # Write your code here\n    pass`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n    }\n};`
    },
    xp: 20,
    coins: 5
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    type: 'practice',
    difficulty: 'Easy',
    topic: 'DSA',
    tags: ['String', 'Stack'],
    companies: ['Amazon', 'Bloomberg', 'LinkedIn'],
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.`,
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' }
    ],
    hints: [
      "Use a stack data structure.",
      "Push opening brackets onto the stack. When you encounter a closing bracket, check if it matches the bracket at the top of the stack."
    ],
    solution: `Use a stack to keep track of opening brackets.
Time Complexity: O(n)
Space Complexity: O(n)

\`\`\`python
def isValid(s):
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return False
        else:
            stack.append(char)
    return not stack
\`\`\``,
    starterCode: {
      javascript: `function isValid(s) {\n  // Write your code here\n}`,
      python: `def isValid(s):\n    # Write your code here\n    pass`,
      java: `class Solution {\n    public boolean isValid(String s) {\n        // Write your code here\n    }\n}`,
      cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        // Write your code here\n    }\n};`
    },
    xp: 20,
    coins: 5
  },
  {
    id: 'longest-substring',
    title: 'Longest Substring Without Repeating Characters',
    type: 'weekly',
    difficulty: 'Medium',
    topic: 'DSA',
    tags: ['String', 'Sliding Window'],
    companies: ['Google', 'Microsoft', 'Amazon'],
    description: `Given a string \`s\`, find the length of the longest substring without repeating characters.`,
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' }
    ],
    hints: [
      "Use a sliding window approach with two pointers.",
      "Keep track of the characters in the current window using a Set or Map."
    ],
    solution: `Sliding Window technique using a Set.
Time Complexity: O(n)
Space Complexity: O(min(m, n))`,
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {\n  // Write your code here\n}`,
      python: `def lengthOfLongestSubstring(s):\n    # Write your code here\n    pass`,
      java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your code here\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write your code here\n    }\n};`
    },
    xp: 40,
    coins: 10
  },
  {
    id: 'employee-salary',
    title: 'Find Highest Earning Employee',
    type: 'practice',
    difficulty: 'Easy',
    topic: 'SQL',
    tags: ['Database', 'Sorting'],
    companies: ['Apple', 'Uber'],
    description: `Table: \`Employees\`

| Column Name | Type    |
|-------------|---------|
| id          | int     |
| name        | varchar |
| salary      | int     |

Write an SQL query to find the name of the employee with the highest salary. If there are multiple, return any.`,
    examples: [
      { 
        input: 'Employees = [{id: 1, name: "Alice", salary: 50000}, {id: 2, name: "Bob", salary: 70000}]', 
        output: '{"name": "Bob"}', 
        explanation: 'Bob has the highest salary.' 
      }
    ],
    hints: [
      "You can use ORDER BY and LIMIT to get the top row."
    ],
    solution: `\`\`\`sql
SELECT name FROM Employees ORDER BY salary DESC LIMIT 1;
\`\`\``,
    starterCode: {
      sql: `-- Write your SQL query here\nSELECT `
    },
    xp: 15,
    coins: 3
  },
  {
    id: 'train-speed-aptitude',
    title: 'Train Speed and Distance',
    type: 'practice',
    difficulty: 'Medium',
    topic: 'Aptitude',
    tags: ['Math', 'Time & Distance'],
    companies: ['TCS', 'Infosys', 'Wipro'],
    description: `A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train in meters?

Write down your logical steps and the final answer in the editor.`,
    examples: [
      { input: 'Speed = 60 km/hr, Time = 9 seconds', output: '150 meters' }
    ],
    hints: [
      "Convert the speed from km/hr to m/s by multiplying by 5/18.",
      "Length of train = Speed in m/s * Time in seconds"
    ],
    solution: `Speed = 60 * (5/18) m/s = 50/3 m/s.
Distance = Speed * Time = (50/3) * 9 = 150 meters.`,
    starterCode: {
      text: `// Type your logic and final answer here\n\nSpeed = \nLength = `
    },
    xp: 10,
    coins: 2
  }
];

module.exports = { CODING_PROBLEMS };
