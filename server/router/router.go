package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/vydelka/db"
)

func SetupRouter(app *fiber.App) {
	app.Get("test", func(c *fiber.Ctx) error {
		err := db.Client.Ping(db.Ctx)
		return c.JSON(fiber.Map{
			"success": err == nil,
		})
	})
}
