package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"os"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

const (
	access_max_age  = time.Hour * 24
	refresh_max_age = time.Hour * 24 * 30
)

type TokenPayload struct {
	Id      string `json:"id"`
	IsAdmin bool   `json:"isAdmin"`
}

type customClaims struct {
	TokenPayload
	jwt.RegisteredClaims
}

func CreateAccessToken(payload TokenPayload) (string, error) {
	claims := customClaims{
		payload,
		jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(access_max_age)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("ACCESS_TOKEN")))
}

func CreateRefreshToken(payload TokenPayload) (string, error) {
	claims := customClaims{
		payload,
		jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(refresh_max_age)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("REFRESH_TOKEN")))
}

func CreateRefreshCookie(token string) *fiber.Cookie {
	return &fiber.Cookie{
		Name:     "refresh_token",
		Value:    token,
		Expires:  time.Now().Add(refresh_max_age),
		HTTPOnly: true,
	}
}

func VerifyRefreshToken(token string) (*TokenPayload, error) {
	parsed, err := jwt.ParseWithClaims(token, &customClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("REFRESH_TOKEN")), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := parsed.Claims.(*customClaims); ok && parsed.Valid {
		return &claims.TokenPayload, nil
	}

	return nil, err
}

func ClearRefreshCookie() *fiber.Cookie {
	return &fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour * 24),
		HTTPOnly: true,
	}
}

func VerifyAccessToken(token string) (*TokenPayload, error) {
	parsed, err := jwt.ParseWithClaims(token, &customClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("ACCESS_TOKEN")), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := parsed.Claims.(*customClaims); ok && parsed.Valid {
		return &claims.TokenPayload, nil
	}

	return nil, err
}

type UcareToken struct {
	Signature string `json:"signature"`
	Expire    int64  `json:"expire"`
}

func CreateUcareToken() *UcareToken {
	mac := hmac.New(sha256.New, []byte(os.Getenv("UPLOAD_CARE_SECRET")))
	expire := time.Now().Add(access_max_age).Unix()
	mac.Write([]byte(strconv.FormatInt(expire, 10)))
	dataHmac := mac.Sum(nil)
	hmacHex := hex.EncodeToString(dataHmac)
	return &UcareToken{Signature: hmacHex, Expire: expire}
}
