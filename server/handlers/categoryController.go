package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/vydelka/services"
)

func GetCategories(c *fiber.Ctx) error {
	lang := c.Locals("lang").(services.Language)
	categories, err := services.GetCategories(nil, lang)
	if err != nil {
		return c.SendStatus(500)
	}

	return c.JSON(categories)
}

func CreateCategory(c *fiber.Ctx) error {
	input := new(services.NewCategory)
	if err := services.ValidateJSON(c, input); err != nil {
		return err
	}

	id, err := services.CreateCategory(input)
	if err != nil {
		return c.SendStatus(500)
	}

	return c.JSON(fiber.Map{
		"id": id,
	})
}
