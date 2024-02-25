package services

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/yura4ka/vydelka/db"
)

type PayType string

const (
	PAY_NOW     PayType = "pay_now"
	PAY_RECEIVE PayType = "pay_receive"
)

type DeliveryType string

const (
	DELIVERY      DeliveryType = "delivery"
	DELIVERY_SELF DeliveryType = "self"
)

type OrderProduct struct {
	Id    string `json:"id" validate:"required"`
	Count int    `json:"count" validate:"required,min=1"`
}

type NewOrder struct {
	Id           string         `json:"-"`
	DeliveryType DeliveryType   `json:"deliveryType" validate:"required" mod:"trim"`
	Address      *string        `json:"address" validate:"required_if=DeliveryType delivery" mod:"trim"`
	PaymentType  PayType        `json:"paymentType" validate:"required" mod:"trim"`
	Products     []OrderProduct `json:"products" validate:"required"`
}

func CreateOrder(order *NewOrder, userId string, lang Language) (string, error) {
	tx, err := db.Client.Begin(db.Ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(db.Ctx)

	var id string
	err = pgxscan.Get(db.Ctx, tx, &id, `
		INSERT INTO orders (delivery, delivery_address, pay, user_id)
		VALUES ($1, $2, $3, $4)
		RETURNING id;
	`, order.DeliveryType, order.Address, order.PaymentType, userId)
	if err != nil {
		return "", err
	}

	values := make([]string, len(order.Products))
	args := make([]any, 0)
	args = append(args, id)
	argsCnt := 1

	for i, p := range order.Products {
		values[i] = fmt.Sprintf("($1, $%v, $%v)", argsCnt+1, argsCnt+2)
		args = append(args, p.Id, p.Count)
		argsCnt += 2
	}

	_, err = tx.Exec(db.Ctx, `
		INSERT INTO order_content (order_id, product_id, quantity)
		VALUES
	`+strings.Join(values, ", "), args...)
	if err != nil {
		return "", err
	}

	order.Id = id
	var url string
	if order.PaymentType == PAY_NOW {
		url, err = createStripeSession(order, userId, lang)
		if err != nil {
			return "", err
		}
	}

	return url, tx.Commit(db.Ctx)
}

func createStripeSession(order *NewOrder, userId string, lang Language) (string, error) {
	ids := make([]string, len(order.Products))
	productCost := make(map[string]int)
	for i, v := range order.Products {
		ids[i] = v.Id
		productCost[v.Id] = v.Count
	}

	products, err := GetProducts(&ProductsRequest{
		Lang: lang,
		Ids:  ids,
	})
	if err != nil {
		return "", err
	}

	user, err := GetUserById(userId)
	if err != nil {
		return "", err
	}

	lineItems := make([]*stripe.CheckoutSessionLineItemParams, len(products))
	for i, p := range products {
		lineItems[i] = &stripe.CheckoutSessionLineItemParams{
			PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
				ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
					Name:   p.Title,
					Images: stripe.StringSlice([]string{p.Images[0].ImageUrl}),
				},
				UnitAmount:  stripe.Int64(int64(p.Price)),
				Currency:    stripe.String(string(stripe.CurrencyUAH)),
				TaxBehavior: stripe.String(string(stripe.TaxCalculationLineItemTaxBehaviorExclusive)),
			},
			Quantity: stripe.Int64(int64(productCost[p.Id])),
		}
	}

	params := &stripe.CheckoutSessionParams{
		CustomerEmail: &user.Email,
		LineItems:     lineItems,
		Mode:          stripe.String(string(stripe.CheckoutSessionModePayment)),
		Metadata: map[string]string{
			"orderId": order.Id,
		},
		SuccessURL:       stripe.String(os.Getenv("CLIENT_ADDR") + "/orders?success"),
		CancelURL:        stripe.String(os.Getenv("CLIENT_ADDR") + "/checkout"),
		CustomerCreation: stripe.String(string(stripe.CheckoutSessionCustomerCreationAlways)),
	}

	s, err := session.New(params)
	return s.URL, err
}

func ConfirmOrder(id string) error {
	_, err := db.Client.Exec(db.Ctx, `
		UPDATE orders SET payment_time = $1
		WHERE id = $2;
	`, time.Now(), id)
	return err
}
