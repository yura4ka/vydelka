package services

import (
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"text/template"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/yura4ka/vydelka/db"
	"golang.org/x/crypto/bcrypt"
)

var ErrWrongPassword = errors.New("wrong password")
var ErrTooManyAttempts = errors.New("too many attempts")
var ErrWrongCode = errors.New("wrong code")
var ErrCodeExpired = errors.New("code expired")

const (
	RESTORATION_TIMEOUT      = time.Hour * 6
	MAX_RESTORATION_ATTEMPTS = 5
)

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
	Id                       string
	CreatedAt                time.Time
	IsAdmin                  bool
	FirstName                string
	LastName                 string
	Email                    string
	Phone                    string
	Password                 string
	RestorationCode          *string
	RestorationExpiresAt     *time.Time
	LastRestorationAt        *time.Time
	LastRestorationAttemptAt *time.Time
	RestorationAttempts      int
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
			request.User.FirstName, request.User.LastName, request.User.PhoneNumber)
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

type RestorationCodeResponse struct {
	Attempts    int `json:"attempts"`
	MaxAttempts int `json:"maxAttempts"`
}

func GenerateRestoreCode(email string, lang Language) (*RestorationCodeResponse, error) {
	user, err := GetUserByEmail(email)
	if err != nil || user == nil {
		return nil, err
	}

	if user.LastRestorationAt != nil &&
		user.LastRestorationAt.Add(RESTORATION_TIMEOUT).Compare(time.Now()) > 0 {
		return nil, ErrTooManyAttempts
	}

	if user.RestorationAttempts == MAX_RESTORATION_ATTEMPTS &&
		user.LastRestorationAttemptAt.Add(RESTORATION_TIMEOUT).Compare(time.Now()) > 0 {
		return nil, ErrTooManyAttempts
	}

	path, err := filepath.Abs(fmt.Sprintf("./templates/RestorePassword_%s.html", lang[:2]))
	if err != nil {
		return nil, err
	}
	subject := "Password Restoration"
	if lang == Languages.Ua {
		subject = "Відновлення паролю"
	}

	code := GenerateRandomCode()

	data := struct{ Link, Code string }{os.Getenv("CLIENT_ADDR"), code}
	err = SendEmail(email, subject, path, data)
	if err != nil {
		return nil, err
	}

	attempts := 0
	if user.LastRestorationAttemptAt != nil &&
		user.LastRestorationAttemptAt.Add(RESTORATION_TIMEOUT).Compare(time.Now()) > 0 {
		attempts = user.RestorationAttempts
	}

	_, err = db.Client.Exec(db.Ctx, `
		UPDATE users
		SET restoration_code = $1, restoration_expires_at = $2, restoration_attempts = $3
		WHERE email = $4;
	`, code, time.Now().Add(time.Hour*24), attempts, email)

	return &RestorationCodeResponse{
		Attempts:    attempts,
		MaxAttempts: MAX_RESTORATION_ATTEMPTS,
	}, err
}

type CheckCodeRequest struct {
	Email string `json:"email" validate:"email" mod:"trim"`
	Code  string `json:"code" validate:"required" mod:"trim"`
}

func CheckResetCode(request *CheckCodeRequest) (bool, error) {
	user, err := GetUserByEmail(request.Email)
	if err != nil || user == nil {
		return false, err
	}

	if user.LastRestorationAt != nil &&
		user.LastRestorationAt.Add(RESTORATION_TIMEOUT).Compare(time.Now()) > 0 {
		return false, ErrTooManyAttempts
	}

	if user.RestorationAttempts == MAX_RESTORATION_ATTEMPTS &&
		user.LastRestorationAttemptAt.Add(RESTORATION_TIMEOUT).Compare(time.Now()) > 0 {
		return false, ErrTooManyAttempts
	}

	if user.RestorationExpiresAt != nil &&
		user.RestorationExpiresAt.Compare(time.Now()) <= 0 {
		return false, ErrCodeExpired
	}

	isEqual := *user.RestorationCode == request.Code
	attempts := user.RestorationAttempts
	if !isEqual {
		attempts++
	}

	_, err = db.Client.Exec(db.Ctx, `
		UPDATE users SET
		last_restoration_attempt_at = $1, restoration_attempts = $2
		WHERE email = $3
	`, time.Now(), attempts, request.Email)

	return isEqual, err
}

type ResetPasswordRequest struct {
	CheckCodeRequest
	NewPassword string
}

func ResetPassword(request *ResetPasswordRequest) error {
	isEqual, err := CheckResetCode(&request.CheckCodeRequest)
	if err != nil {
		return err
	}
	if !isEqual {
		return ErrWrongCode
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(request.NewPassword), 10)
	if err != nil {
		return err
	}

	_, err = db.Client.Exec(db.Ctx, `
		UPDATE users
		SET restoration_attempts = 0, restoration_code = NULL,
			last_restoration_at = $1, restoration_expires_at = $1, password = $2
		WHERE email = $3
	`, time.Now(), hashed, request.Email)

	return err
}
