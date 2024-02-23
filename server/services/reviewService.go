package services

import (
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/yura4ka/vydelka/db"
)

const REVIEWS_PER_PAGE = 10

type Review struct {
	Id         string     `json:"id"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  *time.Time `json:"updatedAt,omitempty"`
	Content    string     `json:"content"`
	Rating     int        `json:"rating"`
	UserId     string     `json:"userId"`
	Username   string     `json:"userName"`
	ProductId  string     `json:"productId"`
	IsVerified bool       `json:"isVerified"`
}

func GetReviews(productId string, page int) ([]Review, error) {
	reviews := make([]Review, 0)
	err := pgxscan.Select(db.Ctx, db.Client, &reviews, `
		SELECT r.id, r.created_at, r.updated_at, r.content, r.rating, r.product_id,
			u.id AS user_id,
			(u.first_name || ' ' || u.last_name) AS username,
			CASE WHEN COUNT(o.*) > 0 THEN TRUE ELSE FALSE END is_verified
		FROM reviews AS r
		LEFT JOIN users AS u ON r.user_id = u.id
		LEFT JOIN order_content AS oc ON r.product_id = oc.product_id
		LEFT JOIN orders AS o ON oc.order_id = o.id AND u.id = o.user_id
		WHERE r.product_id = $1
		GROUP BY r.id, u.id
		ORDER BY r.created_at DESC
		LIMIT $2 OFFSET $3;
	`, productId, REVIEWS_PER_PAGE, (page-1)*REVIEWS_PER_PAGE)
	return reviews, err
}

func HasMoreReviews(productId string, page int) (bool, int, error) {
	var total int
	err := pgxscan.Get(db.Ctx, db.Client, &total, `
		SELECT COUNT(*) 
		FROM reviews
		WHERE product_id = $1; 
	`, productId)

	hasMore := total > page*REVIEWS_PER_PAGE
	totalPages := (total + REVIEWS_PER_PAGE - 1) / REVIEWS_PER_PAGE

	return hasMore, totalPages, err
}

type NewReview struct {
	Content string `json:"content" validate:"required,max=10000" mod:"trim"`
	Rating  int    `json:"rating" validate:"required,min=0,max=5"`
}

func CreateReview(userId, productId string, review *NewReview) (string, error) {
	var id string
	err := pgxscan.Get(db.Ctx, db.Client, &id, `
		INSERT INTO reviews (content, rating, user_id, product_id)
		VALUES ($1, $2, $3, $4)
		RETURNING id;
	`, review.Content, review.Rating, userId, productId)
	return id, err
}

func ChangeReview(userId, productId, reviewId string, review *NewReview) error {
	_, err := db.Client.Exec(db.Ctx, `
		UPDATE reviews SET content = $1, rating = $2
		WHERE user_id = $3 AND product_id = $4 AND id = $5
	`, review.Content, review.Rating, userId, productId, reviewId)
	return err
}

func DeleteReview(userId, productId, reviewId string) error {
	_, err := db.Client.Exec(db.Ctx, `
		DELETE FROM reviews
		WHERE id = $1 AND user_id = $2 AND product_id = $3
	`, reviewId, userId, productId)
	return err
}
