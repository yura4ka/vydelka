package handlers

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/webhook"
	"github.com/yura4ka/vydelka/services"
)

func CreateOrder(c *fiber.Ctx) error {
	input := new(services.NewOrder)
	if err := services.ValidateJSON(c, input); err != nil {
		return err
	}

	userId := c.Locals("userId").(string)
	lang := c.Locals("lang").(services.Language)

	url, err := services.CreateOrder(input, userId, lang)
	if err != nil {
		return c.SendStatus(500)
	}

	return c.JSON(fiber.Map{
		"url": url,
	})
}

func HandleWebhook(c *fiber.Ctx) error {
	payload := c.Body()
	sigHeader := c.Get("Stripe-Signature")
	endpointSecret := os.Getenv("STRIPE_WEBHOOK")
	event, err := webhook.ConstructEvent(payload, sigHeader, endpointSecret)
	if err != nil {
		return c.SendStatus(400)
	}

	switch event.Type {
	case stripe.EventTypeCheckoutSessionCompleted:
		session := event.Data.Object
		metadata := session["metadata"].(map[string]interface{})
		orderId := metadata["orderId"].(string)
		err := services.ConfirmOrder(orderId)
		if err != nil {
			return c.SendStatus(500)
		}
	default:
		log.Printf("Unhandled event type: %v\n", event.Type)
	}

	return c.SendStatus(200)
}
