package handlers

import (
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

	idsStr := c.Query("ids")
	ids := make([]string, 0)
	if idsStr != "" {
		ids = strings.Split(idsStr, ",")
	}

	request := &services.ProductsRequest{
		CategoryId:       c.Query("categoryId"),
		WithTranslations: c.QueryBool("withTranslations"),
		Page:             c.QueryInt("page", 0),
		Lang:             c.Locals("lang").(services.Language),
		Filters:          filters,
		OrderBy:          c.Query("orderBy", "new"),
		Ids:              ids,
		Search:           c.Query("q"),
	}

	products, err := services.GetProducts(request)
	if err != nil {
		return fiber.ErrInternalServerError
	}

	total, err := services.GetTotalProducts(request)
	if err != nil {
		return fiber.ErrInternalServerError
	}

	return c.JSON(fiber.Map{
		"products":   products,
		"hasMore":    total.HasMore,
		"totalPages": total.TotalPages,
		"total":      total.Total,
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
		return fiber.ErrInternalServerError
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
		return fiber.ErrInternalServerError
	}

	return c.JSON(fiber.Map{
		"message": "Ok",
	})
}

func DeleteProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := services.DeleteProduct(id); err != nil {
		return fiber.ErrInternalServerError
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
		return fiber.ErrInternalServerError
	}

	return c.JSON(result)
}

func GetProductBySlug(c *fiber.Ctx) error {
	slug := c.Params("product")
	lang := c.Locals("lang").(services.Language)

	product, err := services.GetProductBySlug(slug, lang)
	if err != nil {
		return fiber.ErrInternalServerError
	}
	if product == nil {
		return fiber.ErrNotFound
	}

	return c.JSON(product)
}

func GetProductRoute(c *fiber.Ctx) error {
	slug := c.Params("product")
	lang := c.Locals("lang").(services.Language)

	routes, err := services.GetProductRoute(slug, lang)
	if err != nil {
		return fiber.ErrInternalServerError
	}

	return c.JSON(routes)
}

func GetReviews(c *fiber.Ctx) error {
	id := c.Params("id")
	page := c.QueryInt("page", 1)

	reviews, err := services.GetReviews(id, page)
	if err != nil {
		return fiber.ErrInternalServerError
	}

	hasMore, totalPages, err := services.HasMoreReviews(id, page)
	if err != nil {
		return fiber.ErrInternalServerError
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
		return fiber.ErrInternalServerError
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
		return fiber.ErrInternalServerError
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
		return fiber.ErrInternalServerError
	}

	return c.JSON(fiber.Map{
		"message": "Ok",
	})
}

func GetRecentProducts(c *fiber.Ctx) error {
	location := c.Locals("location").(string)
	lang := c.Locals("lang").(services.Language)

	result, err := services.GetRecentProducts(&location, lang)
	if err != nil {
		return fiber.ErrInternalServerError
	}

	if len(result) == 0 {
		result, err = services.GetRecentProducts(nil, lang)
		if err != nil {
			return fiber.ErrInternalServerError
		}
	}

	return c.JSON(result)
}
