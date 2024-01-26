package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yura4ka/vydelka/services"
)

func ParseLanguage(c *fiber.Ctx) error {
	lang, ok := services.ClientToServerLanguage[c.Get("Content-Language")]
	if !ok {
		lang = services.Languages.En
	}
	c.Locals("lang", lang)
	return c.Next()
}
