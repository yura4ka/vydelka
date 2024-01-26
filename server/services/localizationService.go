package services

import (
	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/jackc/pgx/v5"
	"github.com/yura4ka/vydelka/db"
)

type Language string

var ClientToServerLanguage map[string]Language = map[string]Language{
	"en": "english",
	"ua": "ukrainian",
}

var Languages = struct {
	En Language
	Ua Language
}{
	En: "english",
	Ua: "ukrainian",
}

type Translations struct {
	En string `json:"en" validate:"required" mod:"trim"`
	Ua string `json:"ua" validate:"required" mod:"trim"`
}

func CreateTranslations(tx *pgx.Tx, t Translations) (string, error) {
	var translationItemId string

	err := pgxscan.Get(db.Ctx, *tx, &translationItemId, `
		INSERT INTO translation_items DEFAULT VALUES
		RETURNING id;
	`)
	if err != nil {
		return "", err
	}

	_, err = (*tx).Exec(db.Ctx, `
		INSERT INTO translations (item_id, lang, content)
		VALUES ($1, $2, $3), ($1, $4, $5);
	`, translationItemId, Languages.En, t.En, Languages.Ua, t.Ua)

	return translationItemId, err
}
