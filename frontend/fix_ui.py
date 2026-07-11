import os, re
directory = r'd:\AllProjects\Dummy\codovate\frontend\src'

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'alert(' in content or 'window.confirm(' in content:
                # determine relative path to utils/uiUtils
                rel_path = os.path.relpath(os.path.join(directory, 'utils', 'uiUtils'), root).replace('\\', '/')
                if rel_path == 'uiUtils':
                    rel_path = './uiUtils'
                import_stmt = f"import {{ showAlert, showConfirm }} from '{rel_path}';"
                
                # add import statement after the last import
                lines = content.split('\n')
                last_import_idx = -1
                for i, line in enumerate(lines):
                    if line.startswith('import '):
                        last_import_idx = i
                
                if last_import_idx != -1:
                    lines.insert(last_import_idx + 1, import_stmt)
                else:
                    lines.insert(0, import_stmt)
                
                new_content = '\n'.join(lines)
                
                # replace alert (excluding sweetalert or something else?)
                # We need to make sure we don't match showAlert(
                new_content = re.sub(r'(?<!show)alert\(', 'showAlert(', new_content)
                
                # replace window.confirm
                new_content = new_content.replace('window.confirm(', 'await showConfirm(')
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Fixed {file}')
