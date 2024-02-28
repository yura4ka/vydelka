package services

import (
	"context"
	"fmt"
	"strings"

	"github.com/go-playground/mold/v4/modifiers"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type (
	ErrorResponse struct {
		Error       bool
		FailedField string
		Tag         string
	}

	GlobalErrorHandlerResp struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
	}
)

var FORBIDDEN_FILTERS = []string{"categoryId", "withTranslations", "page", "orderBy", "ids", "q"}

var validate = validator.New()
var conform = modifiers.New()

func Validate(data interface{}) []ErrorResponse {
	validationErrors := []ErrorResponse{}

	err := conform.Struct(context.Background(), data)
	if err != nil {
		validationErrors = append(validationErrors, ErrorResponse{Error: true, Tag: err.Error()})
	}

	errs := validate.Struct(data)
	if errs != nil {
		for _, err := range errs.(validator.ValidationErrors) {
			var elem ErrorResponse

			elem.FailedField = err.Field()
			elem.Tag = err.Tag()
			elem.Error = true

			validationErrors = append(validationErrors, elem)
		}
	}

	return validationErrors
}

func ValidateJSON(c *fiber.Ctx, input interface{}) *fiber.Error {
	if err := c.BodyParser(input); err != nil {
		return &fiber.Error{
			Code:    fiber.ErrBadRequest.Code,
			Message: "Invalid body",
		}
	}

	if errs := Validate(input); len(errs) > 0 && errs[0].Error {
		errMsgs := make([]string, 0)

		for _, err := range errs {
			errMsgs = append(errMsgs, fmt.Sprintf(
				"[%s]: Needs to implement '%s'",
				err.FailedField,
				err.Tag,
			))
		}

		return &fiber.Error{
			Code:    fiber.ErrBadRequest.Code,
			Message: strings.Join(errMsgs, " and "),
		}
	}
	return nil
}

func ValidateVar(field interface{}, tags ...string) error {
	if len(tags) < 2 {
		return nil
	}

	validateTag := tags[0]
	modTag := ""
	if len(tags) > 1 {
		modTag = tags[1]
	}
	conform.Field(context.Background(), field, modTag)
	return validate.Var(field, validateTag)
}

func SetupValidator() {
	validate.RegisterValidation("filter", func(fl validator.FieldLevel) bool {
		return !SliceContains(FORBIDDEN_FILTERS, fl.Field().String())
	})
}
