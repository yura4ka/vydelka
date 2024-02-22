package services

import (
	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/jackc/pgx/v5"
	"github.com/yura4ka/vydelka/db"
)

type Language string

var ClientToServerLanguage map[string]Language = map[string]Language{
	"en": "english",
	"uk": "ukrainian",
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
	Ua string `json:"uk" validate:"required" mod:"trim"`
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

func ChangeTranslation(tx *pgx.Tx, t Translations, translationId string) error {
	_, err := (*tx).Exec(db.Ctx, `
		UPDATE translations SET content = $1 WHERE item_id = $2 AND lang = $3;
	`, t.En, translationId, Languages.En)

	if err != nil {
		return err
	}

	_, err = (*tx).Exec(db.Ctx, `
		UPDATE translations SET content = $1 WHERE item_id = $2 AND lang = $3;
	`, t.Ua, translationId, Languages.Ua)

	return err
}

func DeleteTranslation(tx *pgx.Tx, translationId string) error {
	_, err := (*tx).Exec(db.Ctx, `
		DELETE FROM translation_items WHERE id = $1;
	`, translationId)
	return err
}
