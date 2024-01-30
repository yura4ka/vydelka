package services

import (
	"text/template"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/yura4ka/vydelka/db"
)

type Category struct {
	Id        string    `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	Title     string    `json:"title"`
	Slug      string    `json:"slug"`
	ParentId  *string   `json:"parentId,omitempty"`
	ImageUrl  *string   `json:"imageUrl,omitempty"`
}

func GetCategories(categoryId *string, lang Language) ([]Category, error) {
	result := make([]Category, 0)

	tmpl := template.Must(template.New("categoriesQuery").Parse(`
		SELECT c.id, c.created_at, t.content AS title, c.slug, c.parent_id, c.image_url
		FROM categories AS c
		LEFT JOIN translation_items AS ti ON c.title_translation_item = ti.id
		LEFT JOIN translations AS t ON ti.id = t.item_id AND lang = $1
		{{if .}}
			WHERE c.parent_id = $2;
		{{else}}
			WHERE c.parent_id IS NULL;
		{{end}}
	`))

	args := []any{lang}
	if categoryId != nil {
		args = append(args, categoryId)
	}

	err := pgxscan.Select(db.Ctx, db.Client, &result, ExecuteTemplate(tmpl, categoryId), args...)

	return result, err
}

type NewCategory struct {
	Title    Translations `json:"title" validate:"required"`
	Slug     string       `json:"slug" validate:"required" mod:"trim"`
	ParentId *string      `json:"parentId" mod:"trim"`
	ImageUrl *string      `json:"imageUrl" validate:"omitnil,url" mod:"trim"`
}

func CreateCategory(c *NewCategory) (string, error) {
	tx, err := db.Client.Begin(db.Ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(db.Ctx)

	translationId, err := CreateTranslations(&tx, c.Title)
	if err != nil {
		return "", err
	}

	var id string
	err = pgxscan.Get(db.Ctx, tx, &id, `
		INSERT INTO categories (title_translation_item, slug, parent_id, image_url)
		VALUES ($1, $2, $3, $4)
		RETURNING id; 
	`, translationId, c.Slug, c.ParentId, c.ImageUrl)

	if err != nil {
		return "", err
	}

	err = tx.Commit(db.Ctx)
	return id, err
}

type CategoryInfo struct {
	Category
	Title Translations `json:"title"`
}

func GetCategoryById(id string) (*CategoryInfo, error) {
	rows, err := db.Client.Query(db.Ctx, `
		SELECT c.id, c.created_at, c.slug, c.parent_id, c.image_url,
			t.lang, t.content AS title
		FROM categories AS c
		LEFT JOIN translation_items AS ti ON c.title_translation_item = ti.id
		LEFT JOIN translations AS t ON ti.id = t.item_id
		WHERE c.id = $1;
	`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := new(CategoryInfo)
	translations := make(map[Language]string)
	for rows.Next() {
		var category struct {
			Category
			Lang string
		}
		if err := pgxscan.ScanRow(&category, rows); err != nil {
			return nil, err
		}
		result.Category = category.Category
		translations[Language(category.Lang)] = category.Title
	}

	for k, v := range translations {
		switch k {
		case Languages.En:
			result.Title.En = v
		case Languages.Ua:
			result.Title.Ua = v
		}
	}

	if result.Id == "" {
		return nil, nil
	}

	return result, nil
}

type TChangeCategory struct {
	NewCategory
	Id string `json:"id" validate:"required" mod:"trim"`
}

func ChangeCategory(category *TChangeCategory) error {
	tx, err := db.Client.Begin(db.Ctx)
	defer tx.Rollback(db.Ctx)
	if err != nil {
		return err
	}

	var translationId string
	err = pgxscan.Get(db.Ctx, tx, &translationId, `
		UPDATE categories
		SET slug = $1, image_url = $2
		WHERE id = $3
		RETURNING title_translation_item;
	`, category.Slug, category.ImageUrl, category.Id)
	if err != nil {
		return err
	}

	err = ChangeTranslation(&tx, category.Title, translationId)
	if err != nil {
		return err
	}

	return tx.Commit(db.Ctx)
}
