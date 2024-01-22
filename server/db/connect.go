package db

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Client *pgxpool.Pool
var Ctx context.Context

func Connect() {
	var err error
	Ctx = context.Background()
	Client, err = pgxpool.New(Ctx, os.Getenv("DB_URL"))
	if err != nil {
		log.Fatalf("failed opening connection to postgres: %v", err)
	}
}
