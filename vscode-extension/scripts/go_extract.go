package main

import (
	"encoding/json"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"strings"
)

type Unit struct {
	Type      string `json:"type"`
	Name      string `json:"name"`
	StartLine int    `json:"startLine"`
	EndLine   int    `json:"endLine"`
	Body      string `json:"body"`
}

type Result struct {
	Units   []Unit   `json:"units"`
	Imports []string `json:"imports"`
}

func getLines(src string) []string {
	return strings.Split(src, "\n")
}

func bodyFromLines(lines []string, start, end int) string {
	if start < 1 { start = 1 }
	if end > len(lines) { end = len(lines) }
	return strings.Join(lines[start-1:end], "\n")
}

func main() {
	if len(os.Args) < 2 {
		json.NewEncoder(os.Stdout).Encode(Result{Units: []Unit{}, Imports: []string{}})
		return
	}

	fp := os.Args[1]
	src, err := os.ReadFile(fp)
	if err != nil {
		json.NewEncoder(os.Stdout).Encode(Result{Units: []Unit{}, Imports: []string{}})
		return
	}

	fset := token.NewFileSet()
	f, err := parser.ParseFile(fset, fp, src, 0)
	if err != nil {
		// partial parse — still try to extract what we can
		f, _ = parser.ParseFile(fset, fp, src, parser.AllErrors)
		if f == nil {
			json.NewEncoder(os.Stdout).Encode(Result{Units: []Unit{}, Imports: []string{}})
			return
		}
	}

	lines := getLines(string(src))
	result := Result{Units: []Unit{}, Imports: []string{}}

	// extract imports
	for _, imp := range f.Imports {
		path := strings.Trim(imp.Path.Value, `"`)
		result.Imports = append(result.Imports, path)
	}

	// extract top-level functions and methods
	for _, decl := range f.Decls {
		fd, ok := decl.(*ast.FuncDecl)
		if !ok { continue }

		start := fset.Position(fd.Pos()).Line
		end := fset.Position(fd.End()).Line

		name := fd.Name.Name
		unitType := "function"

		// method: has a receiver
		if fd.Recv != nil && len(fd.Recv.List) > 0 {
			unitType = "method"
			field := fd.Recv.List[0]
			var receiverName string
			switch t := field.Type.(type) {
			case *ast.StarExpr:
				if ident, ok := t.X.(*ast.Ident); ok {
					receiverName = ident.Name
				}
			case *ast.Ident:
				receiverName = t.Name
			}
			if receiverName != "" {
				name = receiverName + "." + fd.Name.Name
			}
		}

		result.Units = append(result.Units, Unit{
			Type:      unitType,
			Name:      name,
			StartLine: start,
			EndLine:   end,
			Body:      bodyFromLines(lines, start, end),
		})
	}

	json.NewEncoder(os.Stdout).Encode(result)
}
