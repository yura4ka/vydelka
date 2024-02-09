package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/vydelka/handlers"
	"github.com/yura4ka/vydelka/middleware"
)

func addProductRouter(app *fiber.App) {
	product := app.Group("product")

	product.Get("/", handlers.GetProducts)
	product.Post("/", middleware.RequireAdmin, handlers.CreateProduct)
	product.Put("/", middleware.RequireAdmin, handlers.ChangeProduct)
	product.Delete("/:id", middleware.RequireAdmin, handlers.DeleteProduct)
}
