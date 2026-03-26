import ast, json, sys

def get_call_name(node):
    try:
        if isinstance(node, ast.Name): return node.id
        if isinstance(node, ast.Attribute):
            p = get_call_name(node.value)
            return (p + '.' + node.attr) if p else node.attr
    except Exception: pass
    return ''

COST_PATTERNS = [
    'completions.create', 'messages.create', 'generatecontent', 'generatetext', 'streamtext',
    'chatcompletion.create', 'completion.create',
    'axios.get', 'axios.post', 'axios.put', 'axios.delete', 'fetch',
    'requests.get', 'requests.post', 'requests.put', 'requests.delete',
    'httpx.get', 'httpx.post', 'httpx.put', 'httpx.delete',
    'prisma.', 'findunique', 'findmany', 'findbyid', 'findone',
    'dynamodb', 'docclient', 'table.scan', 'client.scan',
]

def is_costly(name): return any(p in name.lower() for p in COST_PATTERNS)

class Visitor(ast.NodeVisitor):
    def __init__(self):
        self.loop_line = None
        self.hits = []

    def _loop(self, node):
        prev = self.loop_line
        self.loop_line = node.lineno
        self.generic_visit(node)
        self.loop_line = prev

    visit_For = visit_While = visit_AsyncFor = _loop

    def visit_Call(self, node):
        if self.loop_line is not None:
            name = get_call_name(node.func)
            if name and is_costly(name):
                self.hits.append({
                    'line': node.lineno,
                    'col': node.col_offset,
                    'callName': name,
                    'loopStartLine': self.loop_line,
                })
        self.generic_visit(node)

fp = sys.argv[1]
try:
    src = open(fp, encoding='utf-8', errors='replace').read()
    v = Visitor()
    v.visit(ast.parse(src, filename=fp))
    print(json.dumps(v.hits))
except SyntaxError:
    print(json.dumps([]))
