package services

import (
	"fmt"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/yura4ka/vydelka/db"
	"golang.org/x/crypto/bcrypt"
)

type NewUser struct {
	FirstName   string `json:"firstName" validate:"required" mod:"trim"`
	LastName    string `json:"lastName" validate:"required" mod:"trim"`
	Email       string `json:"email" validate:"required,email"`
	PhoneNumber string `json:"phoneNumber" validate:"required,e164"`
	Password    string `json:"password" validate:"required,min=4" mod:"trim"`
}

func CreateUser(u *NewUser) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(u.Password), 10)
	if err != nil {
		return "", err
	}

	var id string
	err = pgxscan.Get(db.Ctx, db.Client, &id, `
		INSERT INTO users (first_name, last_name, email, phone, password)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id;
	`, u.FirstName, u.LastName, u.Email, u.PhoneNumber, hashed)
	return id, err
}

type User struct {
	Id        string
	CreatedAt time.Time
	IsAdmin   bool
	FirstName string
	LastName  string
	Email     string
	Phone     string
	Password  string
}

func getUserBy(field, value string) (*User, error) {
	var user User
	err := pgxscan.Get(db.Ctx, db.Client, &user, fmt.Sprintf(`
		SELECT * from users WHERE %s = $1;
	`, field), value)
	if pgxscan.NotFound(err) {
		return nil, nil
	}
	return &user, err
}

func GetUserById(id string) (*User, error) {
	return getUserBy("id", id)
}

func GetUserByEmail(email string) (*User, error) {
	return getUserBy("email", email)
}

func GetUserByPhoneNumber(phone string) (*User, error) {
	return getUserBy("phone", phone)
}
