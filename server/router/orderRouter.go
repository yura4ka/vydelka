package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/vydelka/handlers"
	"github.com/yura4ka/vydelka/middleware"
)

func addOrderRouter(app *fiber.App) {
	order := app.Group("order")

	order.Get("/", middleware.RequireAuth, handlers.GetOrders)
	order.Post("/", middleware.RequireAuth, middleware.ParseLocation, handlers.CreateOrder)
	order.Post("/webhook", handlers.HandleWebhook)
	order.Patch("/:id/cancel", middleware.RequireAuth, handlers.CancelOrder)
}
