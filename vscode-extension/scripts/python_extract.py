import ast, json, sys

def extract(fp):
    with open(fp, 'r', encoding='utf-8', errors='replace') as f:
        src = f.read()
    lines = src.splitlines()
    try:
        tree = ast.parse(src, filename=fp)
    except SyntaxError:
        print(json.dumps({'units': [], 'imports': []}))
        return
    imps = []
    for n in ast.walk(tree):
        if isinstance(n, (ast.Import, ast.ImportFrom)):
            seg = ast.get_source_segment(src, n)
            if seg:
                imps.append(seg)
    units = []
    for n in tree.body:
        if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)):
            body = chr(10).join(lines[n.lineno - 1:n.end_lineno])
            units.append({'type': 'function', 'name': n.name, 'startLine': n.lineno, 'endLine': n.end_lineno, 'body': body})
        elif isinstance(n, ast.ClassDef):
            body = chr(10).join(lines[n.lineno - 1:n.end_lineno])
            units.append({'type': 'class', 'name': n.name, 'startLine': n.lineno, 'endLine': n.end_lineno, 'body': body})
            for m in n.body:
                if isinstance(m, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    body = chr(10).join(lines[m.lineno - 1:m.end_lineno])
                    units.append({'type': 'method', 'name': n.name + '.' + m.name, 'startLine': m.lineno, 'endLine': m.end_lineno, 'body': body})
    print(json.dumps({'units': units, 'imports': imps}))

extract(sys.argv[1])
