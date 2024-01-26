package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/vydelka/handlers"
	"github.com/yura4ka/vydelka/middleware"
)

func addCategoryRouter(app *fiber.App) {
	category := app.Group("category")

	category.Get("/", handlers.GetCategories)
	category.Post("/", middleware.RequireAdmin, handlers.CreateCategory)
}
