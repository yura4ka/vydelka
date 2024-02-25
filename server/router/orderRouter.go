package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/vydelka/handlers"
	"github.com/yura4ka/vydelka/middleware"
)

func addOrderRouter(app *fiber.App) {
	order := app.Group("order")

	order.Post("/", middleware.RequireAuth, handlers.CreateOrder)
	order.Post("/webhook", handlers.HandleWebhook)
}
