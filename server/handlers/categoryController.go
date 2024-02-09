package handlers

import (
	"log"

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

func GetFilters(c *fiber.Ctx) error {
	id := c.Params("id")
	withTranslations := c.QueryBool("withTranslations")
	lang := c.Locals("lang").(services.Language)

	filters, err := services.GetFilters(id, withTranslations, lang)
	if err != nil {
		log.Print(err)
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

func GetProducts(c *fiber.Ctx) error {
	categoryId := c.Params("id")
	withTranslations := c.QueryBool("withTranslations")
	page := c.QueryInt("page", 1)
	lang := c.Locals("lang").(services.Language)

	request := &services.ProductsRequest{
		CategoryId: categoryId, WithTranslations: withTranslations, Lang: lang, Page: page,
	}

	products, err := services.GetProducts(request)
	if err != nil {
		return c.SendStatus(500)
	}

	hasMore, total, err := services.HasMoreProducts(request)
	if err != nil {
		return c.SendStatus(500)
	}

	return c.JSON(fiber.Map{
		"products":   products,
		"hasMore":    hasMore,
		"totalPages": total,
	})
}
