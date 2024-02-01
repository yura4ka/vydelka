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
	category.Put("/", middleware.RequireAdmin, handlers.ChangeCategory)
	category.Get("/:id", middleware.RequireAdmin, handlers.GetCategoryById)
	category.Get("/:id/filters", handlers.GetFilters)
	category.Post("/:id/filters", middleware.RequireAdmin, handlers.CreateFilter)
	category.Post("/:id/filters/:filterId/variants", middleware.RequireAdmin, handlers.CreateFilterVariant)
	category.Put("/:id/filters", middleware.RequireAdmin, handlers.ChangeFilters)
}
