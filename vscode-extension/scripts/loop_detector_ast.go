package main

import (
	"encoding/json"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"strings"
)

var costPatterns = []string{
	"completions.new", "messages.new",        // openai-go, anthropic sdk-go
	"createchatcompletion", "createcompletion", // go-openai
	"generatecontent", "generatetext",
	"http.get", "http.post", "http.put", "http.delete",
	"client.get", "client.post", "client.put", "client.delete",
	"do(", // http.Client.Do
	"findone", "findmany", "find(",
	"table.scan", "client.scan",
}

func isCostly(name string) bool {
	lower := strings.ToLower(name)
	for _, p := range costPatterns {
		if strings.Contains(lower, p) {
			return true
		}
	}
	return false
}

func callName(expr ast.Expr) string {
	switch e := expr.(type) {
	case *ast.Ident:
		return e.Name
	case *ast.SelectorExpr:
		parent := callName(e.X)
		if parent == "" {
			return e.Sel.Name
		}
		return parent + "." + e.Sel.Name
	}
	return ""
}

type Hit struct {
	Line          int    `json:"line"`
	Col           int    `json:"col"`
	CallName      string `json:"callName"`
	LoopStartLine int    `json:"loopStartLine"`
}

func walk(node ast.Node, fset *token.FileSet, loopLine int, hits *[]Hit) {
	if node == nil {
		return
	}
	switch n := node.(type) {
	case *ast.ForStmt, *ast.RangeStmt:
		pos := fset.Position(node.Pos())
		ast.Inspect(node, func(inner ast.Node) bool {
			if inner == node {
				return true
			}
			if call, ok := inner.(*ast.CallExpr); ok {
				name := callName(call.Fun)
				if name != "" && isCostly(name) {
					p := fset.Position(call.Pos())
					*hits = append(*hits, Hit{
						Line:          p.Line,
						Col:           p.Column - 1,
						CallName:      name,
						LoopStartLine: pos.Line,
					})
				}
			}
			return true
		})
		return // already walked inside
	case *ast.File:
		for _, decl := range n.Decls {
			walk(decl, fset, loopLine, hits)
		}
	case *ast.FuncDecl:
		if n.Body != nil {
			walk(n.Body, fset, loopLine, hits)
		}
	case *ast.BlockStmt:
		for _, stmt := range n.List {
			walk(stmt, fset, loopLine, hits)
		}
	default:
		ast.Inspect(n, func(inner ast.Node) bool {
			if inner == n {
				return true
			}
			if _, ok := inner.(*ast.ForStmt); ok {
				walk(inner, fset, loopLine, hits)
				return false
			}
			if _, ok := inner.(*ast.RangeStmt); ok {
				walk(inner, fset, loopLine, hits)
				return false
			}
			return true
		})
	}
}

func main() {
	if len(os.Args) < 2 {
		json.NewEncoder(os.Stdout).Encode([]Hit{})
		return
	}

	fp := os.Args[1]
	fset := token.NewFileSet()
	f, err := parser.ParseFile(fset, fp, nil, 0)
	if err != nil {
		json.NewEncoder(os.Stdout).Encode([]Hit{})
		return
	}

	var hits []Hit
	walk(f, fset, 0, &hits)
	if hits == nil {
		hits = []Hit{}
	}
	json.NewEncoder(os.Stdout).Encode(hits)
}
