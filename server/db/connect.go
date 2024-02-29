package db

import (
	"context"
	"embed"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
	"golang.org/x/crypto/bcrypt"
)

var Client *pgxpool.Pool
var Ctx context.Context

func addAdmin() error {
	log.Println("creating admin user...")
	hashed, err := bcrypt.GenerateFromPassword([]byte(os.Getenv("POSTGRES_PASSWORD")), 10)
	if err != nil {
		return err
	}

	_, err = Client.Exec(Ctx, `
		INSERT INTO users (first_name, last_name, phone, is_admin, email, password)
		VALUES ('Admin', 'Admin', '+380950000000', TRUE, $1, $2)
		ON CONFLICT DO NOTHING;
	`, os.Getenv("EMAIL_FROM"), hashed)

	return err
}

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

	if err := addAdmin(); err != nil {
		panic(err)
	}
}
