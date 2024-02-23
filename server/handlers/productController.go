package handlers

import (
	"log"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/vydelka/services"
)

func GetProducts(c *fiber.Ctx) error {
	filters := make(map[string][]string)
	for k, v := range c.Queries() {
		if !services.SliceContains(services.FORBIDDEN_FILTERS, k) {
			filters[k] = strings.Split(v, " ")
		}
	}

	request := &services.ProductsRequest{
		CategoryId:       c.Query("categoryId"),
		WithTranslations: c.QueryBool("withTranslations"),
		Page:             c.QueryInt("page", 1),
		Lang:             c.Locals("lang").(services.Language),
		Filters:          filters,
		OrderBy:          c.Query("orderBy", "new"),
	}

	products, err := services.GetProducts(request)
	if err != nil {
		log.Print(err)
		return c.SendStatus(500)
	}

	hasMore, total, err := services.HasMoreProducts(request)
	if err != nil {
		log.Print(err)
		return c.SendStatus(500)
	}

	return c.JSON(fiber.Map{
		"products":   products,
		"hasMore":    hasMore,
		"totalPages": total,
	})
}

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

func GetPopularProducts(c *fiber.Ctx) error {
	category := c.Query("category")
	lang := c.Locals("lang").(services.Language)

	result, err := services.GetPopularProducts(category, lang)
	if err != nil {
		return c.SendStatus(500)
	}

	return c.JSON(result)
}

func GetProductBySlug(c *fiber.Ctx) error {
	slug := c.Params("product")
	lang := c.Locals("lang").(services.Language)

	product, err := services.GetProductBySlug(slug, lang)
	if err != nil {
		return c.SendStatus(500)
	}
	if product == nil {
		return c.SendStatus(400)
	}

	return c.JSON(product)
}

func GetProductRoute(c *fiber.Ctx) error {
	slug := c.Params("product")
	lang := c.Locals("lang").(services.Language)

	routes, err := services.GetProductRoute(slug, lang)
	if err != nil {
		return c.SendStatus(500)
	}

	return c.JSON(routes)
}

func GetReviews(c *fiber.Ctx) error {
	id := c.Params("id")
	page := c.QueryInt("page", 1)

	reviews, err := services.GetReviews(id, page)
	if err != nil {
		return c.SendStatus(500)
	}

	hasMore, totalPages, err := services.HasMoreReviews(id, page)
	if err != nil {
		return c.SendStatus(500)
	}

	return c.JSON(fiber.Map{
		"totalPages": totalPages,
		"hasMore":    hasMore,
		"reviews":    reviews,
	})
}

func CreateReview(c *fiber.Ctx) error {
	input := new(services.NewReview)
	if err := services.ValidateJSON(c, input); err != nil {
		return err
	}
	id := c.Params("id")
	userId := c.Locals("userId").(string)

	reviewId, err := services.CreateReview(userId, id, input)
	if err != nil {
		return c.SendStatus(500)
	}

	return c.JSON(reviewId)
}

func ChangeReview(c *fiber.Ctx) error {
	input := new(services.NewReview)
	if err := services.ValidateJSON(c, input); err != nil {
		return err
	}
	id := c.Params("id")
	reviewId := c.Params("reviewId")
	userId := c.Locals("userId").(string)

	err := services.ChangeReview(userId, id, reviewId, input)
	if err != nil {
		return c.SendStatus(500)
	}

	return c.JSON(fiber.Map{
		"message": "Ok",
	})
}

func DeleteReview(c *fiber.Ctx) error {
	id := c.Params("id")
	reviewId := c.Params("reviewId")
	userId := c.Locals("userId").(string)

	err := services.DeleteReview(userId, id, reviewId)
	if err != nil {
		return c.SendStatus(500)
	}

	return c.JSON(fiber.Map{
		"message": "Ok",
	})
}
