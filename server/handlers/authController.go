package handlers

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/vydelka/services"
)

func Register(c *fiber.Ctx) error {
	input := new(services.NewUser)
	if err := services.ValidateJSON(c, input); err != nil {
		return err
	}

	id, err := services.CreateUser(input)
	if err != nil {
		if err := services.IsUniqueViolation(err); err != nil {
			return err
		}
		return fiber.ErrInternalServerError
	}

	return c.JSON(fiber.Map{
		"id": id,
	})
}

func Login(c *fiber.Ctx) error {
	type Input struct {
		EmailOrPhone string `json:"emailOrPhone" validate:"required" mod:"trim"`
		Password     string `json:"password" validate:"required" mod:"trim"`
	}

	input := new(Input)
	if err := services.ValidateJSON(c, input); err != nil {
		return err
	}

	var user *services.User
	var err error

	if errEmail := services.ValidateVar(input.EmailOrPhone, "email"); errEmail == nil {
		user, err = services.GetUserByEmail(input.EmailOrPhone)
		if err != nil {
			return fiber.ErrInternalServerError
		}
	} else if errPhone := services.ValidateVar(input.EmailOrPhone, "e164"); errPhone == nil {
		user, err = services.GetUserByPhoneNumber(input.EmailOrPhone)
		if err != nil {
			return fiber.ErrInternalServerError
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

	if err := services.CompareHashAndPassword(user.Password, input.Password); err != nil {
		return &fiber.Error{
			Code:    400,
			Message: "Wrong password",
		}
	}

	access, _ := services.CreateAccessToken(services.TokenPayload{Id: user.Id, IsAdmin: user.IsAdmin})
	refresh, _ := services.CreateRefreshToken(services.TokenPayload{Id: user.Id, IsAdmin: user.IsAdmin})
	if access == "" || refresh == "" {
		return fiber.ErrInternalServerError
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
		return fiber.ErrBadRequest
	}

	user, err := services.GetUserById(payload.Id)
	if err != nil || user == nil {
		c.Cookie(services.ClearRefreshCookie())
		if user == nil {
			return fiber.ErrBadRequest
		}
		return fiber.ErrInternalServerError
	}

	newAccess, _ := services.CreateAccessToken(services.TokenPayload{Id: payload.Id, IsAdmin: user.IsAdmin})
	newRefresh, _ := services.CreateRefreshToken(services.TokenPayload{Id: payload.Id, IsAdmin: user.IsAdmin})
	if newAccess == "" || newRefresh == "" {
		return fiber.ErrInternalServerError
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
		return fiber.ErrInternalServerError
	}

	if u == nil {
		return c.SendStatus(200)
	}

	userId, _ := c.Locals("userId").(string)
	if userId == u.Id {
		return c.SendStatus(200)
	}

	return fiber.ErrConflict
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
		return fiber.ErrInternalServerError
	}

	if u == nil {
		return c.SendStatus(200)
	}

	userId, _ := c.Locals("userId").(string)
	if userId == u.Id {
		return c.SendStatus(200)
	}

	return fiber.ErrConflict
}

func Logout(c *fiber.Ctx) error {
	c.Cookie(services.ClearRefreshCookie())
	return c.SendStatus(200)
}

func PatchUser(c *fiber.Ctx) error {
	input := new(services.TChangeUser)
	if err := services.ValidateJSON(c, input); err != nil {
		return err
	}

	userId := c.Locals("userId").(string)
	err := services.ChangeUser(userId, input)
	if err != nil {
		if errors.Is(err, services.ErrWrongPassword) {
			return fiber.ErrBadRequest
		}
		return fiber.ErrInternalServerError
	}

	return c.JSON(fiber.Map{
		"message": "Ok",
	})
}
