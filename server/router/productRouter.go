package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/vydelka/handlers"
	"github.com/yura4ka/vydelka/middleware"
)

func addProductRouter(app *fiber.App) {
	product := app.Group("product")

	product.Get("/", handlers.GetProducts)
	product.Get("/popular", handlers.GetPopularProducts)
	product.Get("/:product", handlers.GetProductBySlug)
	product.Get("/:product/route", handlers.GetProductRoute)
	product.Post("/", middleware.RequireAdmin, handlers.CreateProduct)
	product.Put("/", middleware.RequireAdmin, handlers.ChangeProduct)
	product.Delete("/:id", middleware.RequireAdmin, handlers.DeleteProduct)
	product.Get("/:id/reviews", handlers.GetReviews)
	product.Post("/:id/reviews", middleware.RequireAuth, handlers.CreateReview)
	product.Put("/:id/reviews/:reviewId", middleware.RequireAuth, handlers.ChangeReview)
	product.Delete("/:id/reviews/:reviewId", middleware.RequireAuth, handlers.DeleteReview)
}
