package services

import (
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/yura4ka/vydelka/db"
)

var ErrCantCancel = errors.New("cannot cancel this order")

const ORDERS_PER_PAGE = 30

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

type OrderStatus string

const (
	ORDER_PROCESSING OrderStatus = "processing"
	ORDER_CONFIRMED  OrderStatus = "confirmed"
	ORDER_RECEIVED   OrderStatus = "received"
	ORDER_EXPIRED    OrderStatus = "expired"
	ORDER_CANCELED   OrderStatus = "canceled"
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
	Products     []OrderProduct `json:"products" validate:"required,min=1,max=100"`
}

func CreateOrder(order *NewOrder, userId, location string, lang Language) (string, error) {
	tx, err := db.Client.Begin(db.Ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(db.Ctx)

	var id string
	err = pgxscan.Get(db.Ctx, tx, &id, `
		INSERT INTO orders (delivery, delivery_address, pay, user_id, region)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id;
	`, order.DeliveryType, order.Address, order.PaymentType, userId, location)
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
		s, err := createStripeSession(order, userId, lang)
		if err != nil {
			return "", err
		}
		url = s.URL

		expires := time.Unix(s.ExpiresAt, 0)
		_, err = tx.Exec(db.Ctx, `
			UPDATE orders 
			SET payment_expiration_time = $1, stripe_session_id = $2, stripe_url = $3
			WHERE id = $4;
		`, expires, s.ID, url, id)
		if err != nil {
			return "", err
		}
	}

	return url, tx.Commit(db.Ctx)
}

func createStripeSession(order *NewOrder, userId string, lang Language) (*stripe.CheckoutSession, error) {
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
		return nil, err
	}

	user, err := GetUserById(userId)
	if err != nil {
		return nil, err
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
		SuccessURL: stripe.String(os.Getenv("CLIENT_ADDR") + "/orders?success"),
		CancelURL:  stripe.String(os.Getenv("CLIENT_ADDR") + "/orders?canceled"),
	}

	s, err := session.New(params)
	return s, err
}

func ConfirmOrder(id string) error {
	_, err := db.Client.Exec(db.Ctx, `
		UPDATE orders SET payment_time = $1
		WHERE id = $2;
	`, time.Now(), id)
	return err
}

func ExpirePayment(id string) error {
	_, err := db.Client.Exec(db.Ctx, `
		UPDATE orders SET status = $1
		WHERE id = $2;
	`, ORDER_EXPIRED, id)
	return err
}

func CancelOrder(id, userId string) error {
	var order struct {
		Status      OrderStatus
		PaymentTime *time.Time
	}

	err := pgxscan.Get(db.Ctx, db.Client, &order, `
		SELECT status, payment_time
		FROM orders
		WHERE id = $1 AND user_id = $2
	`, id, userId)

	if pgxscan.NotFound(err) {
		return ErrCantCancel
	}

	if err != nil {
		return err
	}

	if order.PaymentTime != nil || !(order.Status == ORDER_PROCESSING || order.Status == ORDER_CONFIRMED) {
		return ErrCantCancel
	}

	_, err = db.Client.Exec(db.Ctx, `
		UPDATE orders SET status = $1
		WHERE id = $2 AND user_id = $3;
	`, ORDER_CANCELED, id, userId)

	return err
}

type Order struct {
	Id                    string       `json:"id"`
	CreatedAt             time.Time    `json:"createdAt"`
	Delivery              DeliveryType `json:"deliveryType"`
	DeliveryAddress       *string      `json:"deliveryAddress,omitempty"`
	Pay                   PayType      `json:"payType"`
	PaymentTime           *time.Time   `json:"paymentTime,omitempty"`
	StripeUrl             *string      `json:"stripeUrl,omitempty"`
	Status                OrderStatus  `json:"status"`
	TakeoutExpirationTime *time.Time   `json:"takeoutExpirationTime,omitempty"`
	Total                 uint64       `json:"total"`
	ItemsCount            int          `json:"itemsCount"`
}

func GetOrders(userId string, page int) ([]Order, error) {
	orders := make([]Order, 0)
	limit := ORDERS_PER_PAGE
	offset := (page - 1) * ORDERS_PER_PAGE
	err := pgxscan.Select(db.Ctx, db.Client, &orders, `
		SELECT 
			o.id, o.created_at, o.delivery, o.delivery_address, o.pay,
			o.payment_time, o.stripe_url, o.status, o.takeout_expiration_time,
			SUM(p.price * c.quantity) AS total,
			COUNT(c.*) AS items_count
		FROM orders AS o
		INNER JOIN order_content AS c ON o.id = c.order_id
		LEFT JOIN products AS p ON c.product_id = p.id
		WHERE o.user_id = $1
		GROUP BY o.id
		ORDER BY o.created_at DESC
		LIMIT $2 OFFSET $3;
	`, userId, limit, offset)
	return orders, err
}

func HasMoreOrders(userId string, page int) (bool, int, error) {
	var total int
	err := pgxscan.Get(db.Ctx, db.Client, &total, `
		SELECT COUNT(*) FROM orders
		WHERE user_id = $1;
	`, userId)
	if err != nil {
		return false, 0, err
	}

	hasMore := total > page*ORDERS_PER_PAGE
	totalPages := (total + ORDERS_PER_PAGE - 1) / ORDERS_PER_PAGE

	return hasMore, totalPages, nil
}
