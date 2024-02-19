package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/vydelka/services"
)

func GetCategories(c *fiber.Ctx) error {
	lang := c.Locals("lang").(services.Language)
	parentIdQuery := c.Query("parentId")
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

func GetCategory(c *fiber.Ctx) error {
	category := c.Params("category")
	lang := c.Locals("lang").(services.Language)
	var result interface{}
	var err error

	if services.ValidateVar(category, "uuid") == nil {
		result, err = services.GetCategoryById(category)
	} else {
		result, err = services.GetCategoryBySlug(category, lang)
	}

	if err != nil {
		return c.SendStatus(500)
	}
	if result == nil {
		return &fiber.Error{
			Code:    400,
			Message: "Category not found",
		}
	}
	return c.JSON(result)
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

func GetFilters(c *fiber.Ctx) error {
	id := c.Params("id")
	withTranslations := c.QueryBool("withTranslations")
	lang := c.Locals("lang").(services.Language)

	filters, err := services.GetFilters(id, withTranslations, lang)
	if err != nil {
		return c.SendStatus(500)
	}

	return c.JSON(filters)
}

func CreateFilter(c *fiber.Ctx) error {
	id := c.Params("id")
	input := new(services.NewFilter)
	if err := services.ValidateJSON(c, input); err != nil {
		return err
	}

	id, err := services.CreateFilter(id, input)
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

func CreateFilterVariant(c *fiber.Ctx) error {
	id := c.Params("filterId")
	input := new(services.NewFilterVariant)
	if err := services.ValidateJSON(c, input); err != nil {
		return err
	}

	id, err := services.CreateFilterVariant(id, input)
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

func ChangeFilter(c *fiber.Ctx) error {
	input := new(services.TChangeFilter)
	if err := services.ValidateJSON(c, input); err != nil {
		return err
	}

	err := services.ChangeFilter(input)
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

func ChangeFilterVariant(c *fiber.Ctx) error {
	input := new(services.TChangeFilterVariant)
	if err := services.ValidateJSON(c, input); err != nil {
		return err
	}

	err := services.ChangeFilterVariant(input)
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

func DeleteFilter(c *fiber.Ctx) error {
	id := c.Params("filterId")

	err := services.DeleteFilter(id)
	if err != nil {
		return c.SendStatus(500)
	}

	return c.JSON(fiber.Map{
		"message": "Ok",
	})
}

func DeleteFilterVariant(c *fiber.Ctx) error {
	id := c.Params("variantId")

	err := services.DeleteFilterVariant(id)
	if err != nil {
		return c.SendStatus(500)
	}

	return c.JSON(fiber.Map{
		"message": "Ok",
	})
}

func GetNavigationCategories(c *fiber.Ctx) error {
	category := c.Query("category")
	lang := c.Locals("lang").(services.Language)

	categories, err := services.GetNavigationCategories(lang, category)
	if err != nil {
		return c.SendStatus(500)
	}

	return c.JSON(categories)
}

func GetCategoryRoute(c *fiber.Ctx) error {
	category := c.Params("category")
	lang := c.Locals("lang").(services.Language)

	result, err := services.GetCategoryRoute(category, lang)
	if err != nil {
		return c.SendStatus(500)
	}

	return c.JSON(result)
}
