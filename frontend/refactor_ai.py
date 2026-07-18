import os
import re

backend_routes_dir = r"d:\AllProjects\Dummy\codovate\backend\routes"
files = ["roadmap.js", "resume.js", "projects.js", "networking.js", "interviews.js", "coding.js", "ai.js", "assessments.js"]

for filename in files:
    filepath = os.path.join(backend_routes_dir, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Remove const { GoogleGenerativeAI } = require("@google/generative-ai");
    content = re.sub(r'const\s*{\s*GoogleGenerativeAI\s*}\s*=\s*require\("@google/generative-ai"\);\n?', '', content)

    # 2. Replace genAI initialization with import from aiConfig
    content = re.sub(
        r'const\s+genAI\s*=\s*process\.env\.GEMINI_API_KEY[^;]+;\n?',
        'const { getConfiguredModel, genAI } = require("../utils/aiConfig");\n',
        content
    )

    # 3. Replace genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) with await getConfiguredModel()
    content = re.sub(
        r'genAI\.getGenerativeModel\(\{\s*model:\s*"[^"]+"\s*\}\)',
        'await getConfiguredModel()',
        content
    )
    
    # 4. Fix ai.js which I already partially modified
    if filename == "ai.js":
        content = content.replace('const { getConfiguredModel } = require("../utils/aiConfig");', 'const { getConfiguredModel, genAI } = require("../utils/aiConfig");')
        content = content.replace('const model = getModel();', 'const model = await getConfiguredModel();')

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

print("Refactor complete.")
