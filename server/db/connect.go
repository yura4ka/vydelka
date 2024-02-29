package db

import (
	"context"
	"embed"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

var Client *pgxpool.Pool
var Ctx context.Context

func Connect(migrations embed.FS) {
	log.Println("connecting to database...")
	var err error
	Ctx = context.Background()
	Client, err = pgxpool.New(Ctx, os.Getenv("DB_URL"))
	if err != nil {
		log.Fatalf("failed opening connection to postgres: %v", err)
	}

	log.Println("applying migrations...")

	if err := goose.SetDialect("postgres"); err != nil {
		panic(err)
	}

	if err := goose.Up(stdlib.OpenDBFromPool(Client), "migrations"); err != nil {
		panic(err)
	}
}
