package middleware

import (
	"net"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/ipinfo/go/v2/ipinfo"
)

func ParseLocation(c *fiber.Ctx) error {
	ipClient := ipinfo.NewClient(nil, nil, os.Getenv("IP_INFO_TOKEN"))
	info, err := ipClient.GetIPInfo(net.ParseIP(c.IP()))
	if err != nil {
		return fiber.ErrInternalServerError
	}
	c.Locals("location", info.Country)

	return c.Next()
}
