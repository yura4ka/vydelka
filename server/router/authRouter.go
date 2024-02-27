package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/vydelka/handlers"
	"github.com/yura4ka/vydelka/middleware"
)

func addAuthRouter(app *fiber.App) {
	auth := app.Group("auth")

	auth.Patch("/user", middleware.RequireAuth, handlers.PatchUser)
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)
	auth.Get("/refresh", handlers.Refresh)
	auth.Post("/logout", handlers.Logout)
	auth.Get("/availability/email/:email", middleware.ParseAuth, handlers.CheckEmail)
	auth.Get("/availability/phone/:phone", middleware.ParseAuth, handlers.CheckPhoneNumber)
}
