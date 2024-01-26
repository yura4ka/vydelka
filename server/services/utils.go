package services

import (
	"bytes"
	"log"
	"text/template"
)

func ExecuteTemplate(tmpl *template.Template, data any) string {
	var result bytes.Buffer
	if err := tmpl.Execute(&result, data); err != nil {
		log.Print(err)
		panic(err)
	}
	return result.String()
}
