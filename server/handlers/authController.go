package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/vydelka/services"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *fiber.Ctx) error {
	input := new(services.NewUser)
	if err := services.ValidateJSON(c, input); err != nil {
		return err
	}

	id, err := services.CreateUser(input)
	if err != nil {
		return c.SendStatus(400)
	}

	return c.JSON(fiber.Map{
		"id": id,
	})
}

func Login(c *fiber.Ctx) error {
	type Input struct {
		EmailOrPhone string `json:"emailOrPhone" validate:"required"`
		Password     string `json:"password" validate:"required" mod:"trim"`
	}

	input := new(Input)
	if err := services.ValidateJSON(c, input); err != nil {
		return c.SendStatus(400)
	}

	var user *services.User
	var err error

	if errEmail := services.ValidateVar(input.EmailOrPhone, "email"); errEmail == nil {
		user, err = services.GetUserByEmail(input.EmailOrPhone)
		if err != nil {
			return c.SendStatus(500)
		}
	} else if errPhone := services.ValidateVar(input.EmailOrPhone, "e164"); errPhone == nil {
		user, err = services.GetUserByPhoneNumber(input.EmailOrPhone)
		if err != nil {
			return c.SendStatus(500)
		}
	} else {
		return &fiber.Error{
			Code:    400,
			Message: "Email or phone number field is invalid",
		}
	}

	if user == nil {
		return &fiber.Error{
			Code:    400,
			Message: "Wrong credentials",
		}
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		return &fiber.Error{
			Code:    400,
			Message: "Wrong password",
		}
	}

	access, _ := services.CreateAccessToken(services.TokenPayload{Id: user.Id, IsAdmin: user.IsAdmin})
	refresh, _ := services.CreateRefreshToken(services.TokenPayload{Id: user.Id, IsAdmin: user.IsAdmin})
	if access == "" || refresh == "" {
		return c.SendStatus(500)
	}

	var ucareToken *services.UcareToken
	if user.IsAdmin {
		ucareToken = services.CreateUcareToken()
	}

	c.Cookie(services.CreateRefreshCookie(refresh))
	return c.JSON(services.CreateLoginResponse(user, access, ucareToken))
}

func Refresh(c *fiber.Ctx) error {
	refresh := c.Cookies("refresh_token")
	payload, err := services.VerifyRefreshToken(refresh)
	if err != nil {
		return c.SendStatus(400)
	}

	user, err := services.GetUserById(payload.Id)
	if err != nil || user == nil {
		c.Cookie(services.ClearRefreshCookie())
		return c.SendStatus(400)
	}

	newAccess, _ := services.CreateAccessToken(services.TokenPayload{Id: payload.Id, IsAdmin: user.IsAdmin})
	newRefresh, _ := services.CreateRefreshToken(services.TokenPayload{Id: payload.Id, IsAdmin: user.IsAdmin})
	if newAccess == "" || newRefresh == "" {
		return c.SendStatus(500)
	}

	var ucareToken *services.UcareToken
	if user.IsAdmin {
		ucareToken = services.CreateUcareToken()
	}

	c.Cookie(services.CreateRefreshCookie(newRefresh))
	return c.JSON(services.CreateLoginResponse(user, newAccess, ucareToken))
}

func CheckEmail(c *fiber.Ctx) error {
	email := c.Params("email")
	if err := services.ValidateVar(email, "required,email"); err != nil {
		return &fiber.Error{
			Code:    400,
			Message: "Invalid email",
		}
	}

	u, err := services.GetUserByEmail(email)
	if err != nil {
		return c.SendStatus(500)
	}

	if u == nil {
		return c.SendStatus(200)
	}

	log.Print(u)

	userId, _ := c.Locals("userId").(string)
	if userId == u.Id {
		return c.SendStatus(200)
	}

	return c.SendStatus(409)
}

func CheckPhoneNumber(c *fiber.Ctx) error {
	phone := c.Params("phone")
	if err := services.ValidateVar(phone, "required,e164"); err != nil {
		return &fiber.Error{
			Code:    400,
			Message: "Invalid phone number",
		}
	}

	u, err := services.GetUserByPhoneNumber(phone)
	if err != nil {
		return c.SendStatus(500)
	}

	if u == nil {
		return c.SendStatus(200)
	}

	userId, _ := c.Locals("userId").(string)
	if userId == u.Id {
		return c.SendStatus(200)
	}

	return c.SendStatus(409)
}

func Logout(c *fiber.Ctx) error {
	c.Cookie(services.ClearRefreshCookie())
	return c.SendStatus(200)
}
