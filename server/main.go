package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
	"github.com/yura4ka/vydelka/db"
	"github.com/yura4ka/vydelka/middleware"
	"github.com/yura4ka/vydelka/router"
	"github.com/yura4ka/vydelka/services"
)

func init() {
	if mode := os.Getenv("MODE"); mode == "PROD" {
		return
	}

	err := godotenv.Load()
	if err != nil {
		log.Print("Error loading .env file")
	}
}

func main() {
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusBadRequest).JSON(services.GlobalErrorHandlerResp{
				Success: false,
				Message: err.Error(),
			})
		},
	})
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     os.Getenv("CLIENT_ADDR"),
		AllowCredentials: true,
	}))
	app.Use(middleware.ParseLanguage)

	db.Connect()
	router.SetupRouter(app)

	port := os.Getenv("PORT")
	if port == "" {
		port = ":8000"
	} else {
		port = ":" + port
	}

	log.Fatal(app.Listen(port))
}
