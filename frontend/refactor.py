import re

with open('src/pages/Opportunities.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Make sure we have React and memo imported
code = code.replace(
    "import { useState, useEffect, useMemo, useRef } from 'react';",
    "import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';"
)

# Extract card component
card_regex = re.compile(r'(<div[^>]*className=\"[^\"]*opp-card[^\"]*\".*?</div>)', re.DOTALL)
match = card_regex.search(code)

if match:
    card_html = match.group(1)
    # Remove key
    card_html = re.sub(r'key=\{opp\.id\}\s*', '', card_html)
    # Replace onClick
    card_html = card_html.replace('onClick={() => setSelectedOpp(opp)}', 'onClick={() => onClick(opp)}')
    # Replace apply handler
    card_html = card_html.replace('handleApply(opp.id)', 'onApply(opp.id)')
    
    new_component = f"""
const OppCard = React.memo(({{ opp, isApplied, isApplying, onClick, onApply, setAppliedIds }}) => {{
  return (
    {card_html}
  );
}});
"""

    # Insert OppCard before Opportunities component
    code = code.replace('const Opportunities = () => {', new_component + '\nconst Opportunities = () => {')

    # Replace map return body
    map_body_regex = re.compile(r'return\s*\(\s*<div[^>]*className=\"[^\"]*opp-card[^\"]*\".*?</div>\s*\);', re.DOTALL)
    
    replacement = """return (
              <OppCard
                key={opp.id}
                opp={opp}
                isApplied={isApplied}
                isApplying={isApplying}
                onClick={setSelectedOpp}
                onApply={handleApply}
                setAppliedIds={setAppliedIds}
              />
            );"""
            
    code = map_body_regex.sub(replacement, code)
    
    with open('src/pages/Opportunities.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print('Success')
else:
    print('Card not found')
