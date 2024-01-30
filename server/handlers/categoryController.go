package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/vydelka/services"
)

func GetCategories(c *fiber.Ctx) error {
	lang := c.Locals("lang").(services.Language)
	parentIdQuery := c.Query("parent_id")
	var parentId *string
	if parentIdQuery != "" {
		parentId = &parentIdQuery
	}

	categories, err := services.GetCategories(parentId, lang)
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
		if err := services.IsUniqueViolation(err); err != nil {
			return err
		}
		return c.SendStatus(500)
	}

	return c.JSON(fiber.Map{
		"id": id,
	})
}

func GetCategoryById(c *fiber.Ctx) error {
	id := c.Params("id")
	category, err := services.GetCategoryById(id)
	if err != nil {
		log.Print(err)
		return c.SendStatus(500)
	}
	if category == nil {
		return &fiber.Error{
			Code:    400,
			Message: "Category not found",
		}
	}
	return c.JSON(category)
}

func ChangeCategory(c *fiber.Ctx) error {
	input := new(services.TChangeCategory)
	if err := services.ValidateJSON(c, input); err != nil {
		return err
	}

	err := services.ChangeCategory(input)
	if err != nil {
		if err := services.IsUniqueViolation(err); err != nil {
			return err
		}
		return c.SendStatus(500)
	}

	return c.JSON(fiber.Map{
		"message": "Ok",
	})
}
