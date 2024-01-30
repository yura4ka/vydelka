package services

import (
	"bytes"
	"errors"
	"log"
	"text/template"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5/pgconn"
)

func ExecuteTemplate(tmpl *template.Template, data any) string {
	var result bytes.Buffer
	if err := tmpl.Execute(&result, data); err != nil {
		log.Print(err)
		panic(err)
	}
	return result.String()
}

func IsUniqueViolation(err error) *fiber.Error {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) || pgErr.Code != pgerrcode.UniqueViolation {
		return nil
	}

	return &fiber.Error{
		Code:    400,
		Message: pgErr.Detail,
	}
}
