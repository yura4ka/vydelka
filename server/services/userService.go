package services

import (
	"errors"
	"fmt"
	"log"
	"text/template"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/yura4ka/vydelka/db"
	"golang.org/x/crypto/bcrypt"
)

var ErrWrongPassword = errors.New("wrong password")

type NewUser struct {
	FirstName   string `json:"firstName" validate:"required" mod:"trim"`
	LastName    string `json:"lastName" validate:"required" mod:"trim"`
	Email       string `json:"email" validate:"required,email" mod:"trim"`
	PhoneNumber string `json:"phoneNumber" validate:"required,e164" mod:"trim"`
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

func CompareHashAndPassword(hash string, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
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

type TChangeUserInfo struct {
	FirstName   *string `json:"firstName" validate:"required_without_all=LastName Email PhoneNumber,omitempty" mod:"trim"`
	LastName    *string `json:"lastName" validate:"required_without_all=FirstName Email PhoneNumber,omitempty" mod:"trim"`
	Email       *string `json:"email" validate:"required_without_all=FirstName LastName PhoneNumber,omitempty,email" mod:"trim"`
	PhoneNumber *string `json:"phoneNumber" validate:"required_without_all=FirstName LastName Email,omitempty,e164" mod:"trim"`
}

type TChangePassword struct {
	NewPassword string `json:"newPassword" validate:"required,min=4" mod:"trim"`
	OldPassword string `json:"oldPassword" validate:"required,min=4" mod:"trim"`
}

type TChangeUser struct {
	User     *TChangeUserInfo `json:"user" validate:"required_without=Password"`
	Password *TChangePassword `json:"password" validate:"required_without=User"`
	Cnt      int              `json:"-"`
}

func ChangeUser(userId string, request *TChangeUser) error {
	tmpl := template.Must(template.New("changeUserRequest").Funcs(template.FuncMap{
		"inc": func(n int) int {
			return n + 1
		},
	}).Parse(`
		{{$arg_counter:=.Cnt}}
		UPDATE users SET
		first_name = 
		{{if and .User .User.FirstName}} ${{$arg_counter}}{{$arg_counter = inc $arg_counter}} {{else}} first_name {{end}},
		last_name = 
		{{if and .User .User.LastName}} ${{$arg_counter}}{{$arg_counter = inc $arg_counter}} {{else}} last_name {{end}},
		email = 
		{{if and .User .User.Email}} ${{$arg_counter}}{{$arg_counter = inc $arg_counter}} {{else}} email {{end}},
		phone = 
		{{if and .User .User.PhoneNumber}} ${{$arg_counter}}{{$arg_counter = inc $arg_counter}} {{else}} phone {{end}},
		password =
		{{if .Password}} ${{$arg_counter}}{{$arg_counter = inc $arg_counter}} {{else}} password {{end}}
		WHERE id = ${{$arg_counter}};
	`))

	args := make([]any, 0)
	if request.User != nil {
		args = AppendIfNotNil(args,
			request.User.FirstName, request.User.LastName, request.User.Email, request.User.PhoneNumber)
	}
	if request.Password != nil {
		user, err := GetUserById(userId)
		if err != nil {
			return err
		}

		if err := CompareHashAndPassword(user.Password, request.Password.OldPassword); err != nil {
			return ErrWrongPassword
		}

		hashed, err := bcrypt.GenerateFromPassword([]byte(request.Password.NewPassword), 10)
		if err != nil {
			return err
		}

		args = append(args, hashed)
	}

	request.Cnt = 1
	args = append(args, userId)
	query := ExecuteTemplate(tmpl, request)
	log.Println(query)
	log.Println(args)
	_, err := db.Client.Exec(db.Ctx, query, args...)
	return err
}
