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

type LoginResponseUser struct {
	Id          string `json:"id"`
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
	Email       string `json:"email"`
	PhoneNumber string `json:"phoneNumber"`
	IsAdmin     *bool  `json:"isAdmin,omitempty"`
}

type LoginResponse struct {
	Token      string            `json:"token"`
	User       LoginResponseUser `json:"user"`
	UcareToken *UcareToken       `json:"ucareToken,omitempty"`
}

func CreateLoginResponse(user *User, token string, ucareToken *UcareToken) LoginResponse {
	var isAdmin *bool
	if user.IsAdmin {
		isAdmin = &user.IsAdmin
	}

	return LoginResponse{
		token,
		LoginResponseUser{user.Id, user.FirstName, user.LastName, user.Email, user.Phone, isAdmin},
		ucareToken,
	}
}
