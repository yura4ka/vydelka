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
	ImageUrl  string    `json:"imageUrl"`
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
	ImageUrl string       `json:"imageUrl" validate:"url" mod:"trim"`
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

type FilterVariant struct {
	Id           string        `json:"id"`
	Slug         string        `json:"slug"`
	Variant      *string       `json:"variant,omitempty"`
	Translations *Translations `json:"translations,omitempty"`
}

type Filter struct {
	Id           string           `json:"id"`
	Slug         string           `json:"slug"`
	Title        *string          `json:"title,omitempty"`
	Translations *Translations    `json:"translations,omitempty"`
	Variants     []*FilterVariant `json:"variants"`
}

func GetFilters(categoryId string, withTranslations bool, lang Language) ([]*Filter, error) {
	result := make([]*Filter, 0)

	tmpl := template.Must(template.New("filtersQuery").Parse(`
		SELECT f.id as "fId", f.slug as "fSlug", ft.content as title,
			v.id as "vId", v.slug as "vSlug", vt.content as variant
			{{if .}}
				, ft.lang as "fLang", vt.lang as "vLang"
			{{end}}
		FROM filters AS f
		LEFT JOIN filter_variants AS v ON f.id = v.filter_id 
		LEFT JOIN translation_items AS fti ON f.title_translation_item = fti.id
		LEFT JOIN translations AS ft ON fti.id = ft.item_id
		{{if not .}}
			AND ft.lang = $2 
		{{end}}
		LEFT JOIN translation_items AS vti ON v.variant_translation_item = vti.id
		LEFT JOIN translations AS vt ON vti.id = vt.item_id
		{{if not .}}
			AND vt.lang = $2 
		{{end}}
		WHERE f.category_id = $1
	`))

	query := ExecuteTemplate(tmpl, withTranslations)
	args := []any{categoryId}
	if !withTranslations {
		args = append(args, lang)
	}

	rows, err := db.Client.Query(db.Ctx, query, args...)
	if err != nil {
		return result, err
	}
	defer rows.Close()

	filterMap := make(map[string]*Filter)

	if !withTranslations {
		for rows.Next() {
			var fId, fSlug, title, vId, vSlug, variant string
			err = rows.Scan(&fId, &fSlug, &title, &vId, &vSlug, &variant)
			if err != nil {
				return result, err
			}

			filter, ok := filterMap[fId]
			if !ok {
				filter = &Filter{Id: fId, Slug: fSlug, Title: &title}
				filterMap[fId] = filter
				result = append(result, filter)
			}
			filter.Variants = append(filter.Variants, &FilterVariant{Id: vId, Slug: vSlug, Variant: &variant})
		}

		return result, nil
	}

	variantMap := make(map[*Filter]map[string]*FilterVariant)
	for rows.Next() {
		var fId, fSlug, title, vId, vSlug, variantTitle, fLang, vLang string
		err = rows.Scan(&fId, &fSlug, &title, &vId, &vSlug, &variantTitle, &fLang, &vLang)
		if err != nil {
			return result, err
		}

		filter, ok := filterMap[fId]
		if !ok {
			filter = &Filter{Id: fId, Slug: fSlug, Translations: &Translations{}}
			filterMap[fId] = filter
			variantMap[filter] = make(map[string]*FilterVariant)
			result = append(result, filter)
		}
		if fLang == string(Languages.En) {
			filter.Translations.En = title
		} else {
			filter.Translations.Ua = title
		}

		variant, ok := variantMap[filter][vId]
		if !ok {
			variant = &FilterVariant{Id: vId, Slug: vSlug, Translations: &Translations{}}
			variantMap[filter][vId] = variant
			filter.Variants = append(filter.Variants, variant)
		}
		if vLang == string(Languages.En) {
			variant.Translations.En = variantTitle
		} else {
			variant.Translations.Ua = variantTitle
		}
	}

	return result, nil
}

type NewFilter struct {
	Title Translations `json:"title" validate:"required"`
	Slug  string       `json:"slug" validate:"required,filter" mod:"trim"`
}

func CreateFilter(categoryId string, f *NewFilter) (string, error) {
	tx, err := db.Client.Begin(db.Ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(db.Ctx)

	translationId, err := CreateTranslations(&tx, f.Title)
	if err != nil {
		return "", err
	}

	var filterId string
	err = pgxscan.Get(db.Ctx, tx, &filterId, `
		INSERT INTO filters (title_translation_item, slug, category_id)
		VALUES ($1, $2, $3)
		RETURNING id;
	`, translationId, f.Slug, categoryId)
	if err != nil {
		return "", err
	}

	return filterId, tx.Commit(db.Ctx)
}

type NewFilterVariant struct {
	Variant Translations `json:"variant" validate:"required"`
	Slug    string       `json:"slug" validate:"required" mod:"trim"`
}

func CreateFilterVariant(filterId string, v *NewFilterVariant) (string, error) {
	tx, err := db.Client.Begin(db.Ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(db.Ctx)

	translationId, err := CreateTranslations(&tx, v.Variant)
	if err != nil {
		return "", err
	}

	var variantId string
	err = pgxscan.Get(db.Ctx, tx, &variantId, `
		INSERT INTO filter_variants (variant_translation_item, slug, filter_id)
		VALUES ($1, $2, $3)
		RETURNING id;
	`, translationId, v.Slug, filterId)
	if err != nil {
		return "", err
	}

	return variantId, tx.Commit(db.Ctx)
}

type TChangeFilter struct {
	NewFilter
	Id string `json:"id" validate:"required" mod:"trim"`
}

func ChangeFilter(f *TChangeFilter) error {
	tx, err := db.Client.Begin(db.Ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(db.Ctx)

	var translationId string
	err = pgxscan.Get(db.Ctx, tx, &translationId, `
		UPDATE filters SET slug = $1
		WHERE id = $2
		RETURNING title_translation_item;
	`, f.Slug, f.Id)
	if err != nil {
		return err
	}

	err = ChangeTranslation(&tx, f.Title, translationId)
	if err != nil {
		return err
	}

	return tx.Commit(db.Ctx)
}

type TChangeFilterVariant struct {
	NewFilterVariant
	Id string `json:"id" validate:"required" mod:"trim"`
}

func ChangeFilterVariant(v *TChangeFilterVariant) error {
	tx, err := db.Client.Begin(db.Ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(db.Ctx)

	var translationId string
	err = pgxscan.Get(db.Ctx, tx, &translationId, `
		UPDATE filter_variants SET slug = $1
		WHERE id = $2
		RETURNING variant_translation_item;
	`, v.Slug, v.Id)
	if err != nil {
		return err
	}

	err = ChangeTranslation(&tx, v.Variant, translationId)
	if err != nil {
		return err
	}

	return tx.Commit(db.Ctx)
}

func DeleteFilter(id string) error {
	tx, err := db.Client.Begin(db.Ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(db.Ctx)

	var translationId string
	err = pgxscan.Get(db.Ctx, tx, &translationId, `
		DELETE FROM filters
		WHERE id = $1
		RETURNING title_translation_item;
	`, id)
	if err != nil {
		return err
	}

	err = DeleteTranslation(&tx, translationId)
	if err != nil {
		return err
	}

	return tx.Commit(db.Ctx)
}

func DeleteFilterVariant(id string) error {
	tx, err := db.Client.Begin(db.Ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(db.Ctx)

	var translationId string
	err = pgxscan.Get(db.Ctx, tx, &translationId, `
		DELETE FROM filter_variants
		WHERE id = $1
		RETURNING variant_translation_item;
	`, id)
	if err != nil {
		return err
	}

	err = DeleteTranslation(&tx, translationId)
	if err != nil {
		return err
	}

	return tx.Commit(db.Ctx)
}

type NavigationCategory struct {
	Category
	Subcategories []*NavigationCategory `json:"subcategories,omitempty"`
}

func GetNavigationCategories(lang Language, parent string) ([]*NavigationCategory, error) {
	tmpl := template.Must(template.New("navigationQuery").Parse(`
		WITH RECURSIVE category_hierarchy AS (
			SELECT c.*, 0 AS level
    	FROM categories AS c
			{{if .}}
				INNER JOIN categories AS parent 
				ON c.parent_id = parent.id AND parent.slug = $2
			{{else}}
				WHERE c.parent_id IS NULL
			{{end}}

			UNION ALL

			SELECT c.*, ch.level + 1
			FROM categories c
			JOIN category_hierarchy ch ON c.parent_id = ch.id
		)

		SELECT c.id, c.created_at, t.content as title, c.slug, c.parent_id, c.image_url
		FROM category_hierarchy AS c
		LEFT JOIN translation_items AS ti ON c.title_translation_item = ti.id
		LEFT JOIN translations AS t ON ti.id = t.item_id AND lang = $1
		ORDER BY level;
	`))

	query := ExecuteTemplate(tmpl, parent)
	args := []any{lang}
	if parent != "" {
		args = append(args, parent)
	}

	rows, err := db.Client.Query(db.Ctx, query, args...)
	if err != nil {
		return nil, err
	}

	result := make([]*NavigationCategory, 0)
	categoryMap := make(map[string]*NavigationCategory)

	for rows.Next() {
		var c NavigationCategory
		err = pgxscan.ScanRow(&c, rows)
		if err != nil {
			return nil, err
		}

		categoryMap[c.Id] = &c

		if c.ParentId == nil {
			result = append(result, &c)
		} else {
			parent, ok := categoryMap[*c.ParentId]
			if !ok {
				result = append(result, &c)
			} else {
				parent.Subcategories = append(parent.Subcategories, &c)
			}
		}
	}

	return result, nil
}

func GetCategoryBySlug(slug string, lang Language) (*Category, error) {
	var category Category
	err := pgxscan.Get(db.Ctx, db.Client, &category, `
		SELECT c.id, c.created_at, c.slug, c.parent_id, c.image_url, t.content AS title
		FROM categories AS c
		LEFT JOIN translation_items AS ti ON c.title_translation_item = ti.id
		LEFT JOIN translations AS t ON ti.id = t.item_id AND t.lang = $1
		WHERE c.slug = $2;
	`, lang, slug)
	return &category, err
}

type CategoryRoute struct {
	Title string `json:"title"`
	Slug  string `json:"slug"`
}

func GetCategoryRoute(slug string, lang Language) ([]CategoryRoute, error) {
	var result []CategoryRoute
	err := pgxscan.Select(db.Ctx, db.Client, &result, `
		WITH RECURSIVE category_tree AS (
			SELECT id, title_translation_item, slug, parent_id, 1 AS level
			FROM categories
			WHERE slug = $1

			UNION ALL

			SELECT c.id, c.title_translation_item, c.slug, c.parent_id, ct.level+1
			FROM categories AS c
			JOIN category_tree AS ct ON c.id = ct.parent_id
		)
		SELECT t.content AS title, c.slug
		FROM category_tree AS c
		LEFT JOIN translation_items AS ti ON c.title_translation_item = ti.id
		LEFT JOIN translations AS t ON ti.id = t.item_id AND lang = $2
		ORDER BY c.level DESC;
	`, slug, lang)
	return result, err
}
