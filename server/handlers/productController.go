package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/vydelka/services"
)

func CreateProduct(c *fiber.Ctx) error {
	input := new(services.NewProduct)
	if err := services.ValidateJSON(c, input); err != nil {
		return err
	}

	id, err := services.CreateProduct(input)
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

func ChangeProduct(c *fiber.Ctx) error {
	input := new(services.TChangeProduct)
	if err := services.ValidateJSON(c, input); err != nil {
		return err
	}

	err := services.ChangeProduct(input)
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

func DeleteProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := services.DeleteProduct(id); err != nil {
		return c.SendStatus(500)
	}
	return c.JSON(fiber.Map{
		"message": "Ok",
	})
}
