package handlers

import (
	"errors"
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
		return fiber.ErrInternalServerError
	}

	return c.JSON(fiber.Map{
		"url": url,
	})
}

func CancelOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	userId := c.Locals("userId").(string)
	err := services.CancelOrder(id, userId)
	if err != nil {
		if errors.Is(err, services.ErrCantCancel) {
			return fiber.ErrBadRequest
		}
		return fiber.ErrInternalServerError
	}
	return c.JSON(fiber.Map{
		"message": "Ok",
	})
}

func GetOrders(c *fiber.Ctx) error {
	userId := c.Locals("userId").(string)
	page := c.QueryInt("page", 1)

	orders, err := services.GetOrders(userId, page)
	if err != nil {
		return fiber.ErrInternalServerError
	}

	hasMore, totalPages, err := services.HasMoreOrders(userId, page)
	if err != nil {
		return fiber.ErrInternalServerError
	}

	return c.JSON(fiber.Map{
		"hasMore":    hasMore,
		"totalPages": totalPages,
		"orders":     orders,
	})
}

func HandleWebhook(c *fiber.Ctx) error {
	payload := c.Body()
	sigHeader := c.Get("Stripe-Signature")
	endpointSecret := os.Getenv("STRIPE_WEBHOOK")
	event, err := webhook.ConstructEvent(payload, sigHeader, endpointSecret)
	if err != nil {
		return fiber.ErrBadRequest
	}

	switch event.Type {
	case stripe.EventTypeCheckoutSessionCompleted:
		session := event.Data.Object
		metadata := session["metadata"].(map[string]interface{})
		orderId := metadata["orderId"].(string)
		err := services.ConfirmOrder(orderId)
		if err != nil {
			return fiber.ErrInternalServerError
		}
	case stripe.EventTypeCheckoutSessionExpired:
		session := event.Data.Object
		metadata := session["metadata"].(map[string]interface{})
		orderId := metadata["orderId"].(string)
		err := services.ExpirePayment(orderId)
		if err != nil {
			return fiber.ErrInternalServerError
		}
	default:
		log.Printf("Unhandled event type: %v\n", event.Type)
	}

	return c.SendStatus(200)
}
