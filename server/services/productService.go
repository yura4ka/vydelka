package services

import (
	"fmt"
	"strings"
	"text/template"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/jackc/pgx/v5"
	"github.com/yura4ka/vydelka/db"
)

const PRODUCTS_PER_PAGE = 36

type ProductImage struct {
	Id       string `json:"id" validate:"required"`
	ImageUrl string `json:"imageUrl" validate:"url"`
	Width    int    `json:"width" validate:"required,min=200"`
	Height   int    `json:"height" validate:"required,min=200"`
}

type baseProductMutation struct {
	Slug        string         `json:"slug" validate:"required" mod:"trim"`
	Price       uint64         `json:"price" validate:"required,min=0"`
	Title       Translations   `json:"title" validate:"required"`
	Description Translations   `json:"description" validate:"required"`
	Filters     []string       `json:"filters" validate:"required"`
	Images      []ProductImage `json:"images" validate:"required,min=1"`
}

type NewProduct struct {
	baseProductMutation
	CategoryId string `json:"categoryId" validate:"required" mod:"trim"`
}

func addProductFilters(tx *pgx.Tx, id string, filters []string) error {
	query := "INSERT INTO product_filters (product_id, variant_id) VALUES\n"
	args := make([]any, len(filters)+1)
	args[0] = id
	values := make([]string, len(filters))

	for i, v := range filters {
		values[i] = fmt.Sprintf("($1, $%d)", i+2)
		args[i+1] = v
	}

	_, err := (*tx).Exec(db.Ctx, query+strings.Join(values, ","), args...)
	return err
}

func addProductImages(tx *pgx.Tx, id string, images []ProductImage) error {
	query := "INSERT INTO product_images (product_id, id, image_url, width, height) VALUES\n"
	args := make([]any, 0, len(images)*3+1)
	args = append(args, id)
	values := make([]string, len(images))

	argCount := 2
	for i, v := range images {
		values[i] = fmt.Sprintf("($1, $%d, $%d, $%d, $%d)", argCount, argCount+1, argCount+2, argCount+3)
		args = append(args, v.Id, v.ImageUrl, v.Width, v.Height)
		argCount += 4
	}

	_, err := (*tx).Exec(db.Ctx, query+strings.Join(values, ","), args...)
	return err
}

func CreateProduct(p *NewProduct) (string, error) {
	tx, err := db.Client.Begin(db.Ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(db.Ctx)

	var id string
	err = pgxscan.Get(db.Ctx, tx, &id, `
		INSERT INTO products (slug, price, category_id)
		VALUES ($1, $2, $3)
		RETURNING id;
	`, p.Slug, p.Price, p.CategoryId)
	if err != nil {
		return "", err
	}

	_, err = tx.Exec(db.Ctx, `
		INSERT INTO product_translations (product_id, lang, title, description)
		VALUES ($1, $2, $3, $4), ($1, $5, $6, $7);
	`, id, Languages.En, p.Title.En, p.Description.En, Languages.Ua, p.Title.Ua, p.Description.Ua)
	if err != nil {
		return "", err
	}

	if err := addProductFilters(&tx, id, p.Filters); err != nil {
		return "", err
	}

	if err := addProductImages(&tx, id, p.Images); err != nil {
		return "", err
	}

	return id, tx.Commit(db.Ctx)
}

type Product struct {
	Id                      string           `json:"id"`
	Slug                    string           `json:"slug"`
	Price                   uint64           `json:"price"`
	Title                   *string          `json:"title,omitempty"`
	Description             *string          `json:"description,omitempty"`
	TitleTranslations       *Translations    `json:"titleTranslations,omitempty"`
	DescriptionTranslations *Translations    `json:"descriptionTranslations,omitempty"`
	Images                  []ProductImage   `json:"images"`
	Filters                 [][2]interface{} `json:"filters"`
	Rating                  float64          `json:"rating"`
	Reviews                 uint64           `json:"reviews"`
	Popularity              uint64           `json:"-"`
}

type productTranslation struct {
	Title       string
	Description string
}

type ProductFilter struct {
	Id       string `json:"id"`
	Slug     string `json:"slug"`
	Variant  string `json:"variant"`
	FilterId string `json:"filterId"`
}

type dbProduct struct {
	Product
	Filters      []ProductFilter `json:"filters"`
	Translations map[Language]productTranslation
}

type ProductsRequest struct {
	CategoryId       string
	WithTranslations bool
	Lang             Language
	Page             int
	Filters          map[string][]string
	Cnt              int
}

func createFiltersQuery(filters map[string][]string) (string, []any) {
	args := make([]any, 0)
	argsCnt := 0

	values := make([]string, 0, len(filters))
	for k, v := range filters {
		values = append(values, fmt.Sprintf("$%v, $%v::varchar[]", argsCnt+1, argsCnt+2))
		args = append(args, k, v)
		argsCnt += 2
	}

	queryFilters := `
		WITH query_filters (filter, variants) AS (
			SELECT ` + strings.Join(values, " UNION ALL SELECT ") +
		`),
			
		filtered_products AS (
			SELECT p.*
			FROM products AS P
			JOIN product_filters AS pf ON p.id = pf.product_id
			JOIN filter_variants AS fv ON pf.variant_id = fv.id
			JOIN filters AS f ON fv.filter_id = f.id
			JOIN query_filters AS qf ON f.slug = qf.filter AND fv.slug = ANY(qf.variants)
			GROUP BY p.id
			HAVING COUNT(*) = (SELECT COUNT(*) FROM query_filters)
		)`
	return queryFilters, args
}

func GetProducts(request *ProductsRequest) ([]Product, error) {
	tmpl := template.Must(template.New("productsQuery").Funcs(template.FuncMap{
		"inc": func(n int) int {
			return n + 1
		},
	}).Parse(`
		{{$arg_counter:=.Cnt}}
		SELECT p.id, p.slug, p.price,
			json_agg(DISTINCT jsonb_build_object(
				'id', pi.id, 'imageUrl', pi.image_url, 'width', pi.width, 'height', pi.height
			)) AS images,
			json_agg(DISTINCT jsonb_build_object(
				'id', fv.id, 'slug', fv.slug, 'variant', ft.content, 'filterId', fv.filter_id
			)) AS filters,
			{{if .WithTranslations}}
				json_object_agg(
					pt.lang, jsonb_build_object('title', pt.title, 'description', pt.description)
				) as translations
			{{else}}
				pt.title, pt.description
			{{end}},
			COALESCE(AVG(r.rating), 0) AS rating,
			COUNT(r.*) AS reviews
		{{if .Filters}}
			FROM filtered_products AS p
		{{else}}
			FROM products AS p
		{{end}}
		LEFT JOIN product_translations AS pt ON p.id = pt.product_id
		{{if not .WithTranslations}}
			AND pt.lang = ${{$arg_counter}}
		{{end}}
		LEFT JOIN product_images AS pi ON p.id = pi.product_id
		LEFT JOIN product_filters AS pf ON p.id = pf.product_id
		LEFT JOIN filter_variants AS fv ON pf.variant_id = fv.id
		LEFT JOIN translation_items AS fti ON fv.variant_translation_item = fti.id
		LEFT JOIN translations AS ft ON fti.id = ft.item_id AND ft.lang = ${{$arg_counter}}
		{{$arg_counter = inc $arg_counter}}
		LEFT JOIN reviews AS r ON p.id = r.product_id
		WHERE p.category_id = ${{$arg_counter}}
		{{$arg_counter = inc $arg_counter}}
		GROUP BY p.id
		{{if .Filters}}
			, p.slug, p.price
		{{end}}
		{{if not .WithTranslations}}
			, pt.title, pt.description
		{{end}}
		LIMIT ${{$arg_counter}}
		{{$arg_counter = inc $arg_counter}}
		OFFSET ${{$arg_counter}};
	`))

	args := make([]any, 0)
	filtersQuery := ""
	if len(request.Filters) != 0 {
		filtersQuery, args = createFiltersQuery(request.Filters)
	}

	request.Cnt = len(args) + 1
	offset := (request.Page - 1) * PRODUCTS_PER_PAGE
	args = append(args, request.Lang, request.CategoryId, PRODUCTS_PER_PAGE, offset)

	query := filtersQuery + ExecuteTemplate(tmpl, request)
	products := make([]dbProduct, 0)
	err := pgxscan.Select(db.Ctx, db.Client, &products, query, args...)
	if err != nil {
		return nil, err
	}

	result := make([]Product, len(products))

	for i, v := range products {
		result[i] = v.Product
		if v.Translations != nil {
			en := v.Translations[Languages.En]
			ua := v.Translations[Languages.Ua]
			result[i].TitleTranslations = &Translations{en.Title, ua.Title}
			result[i].DescriptionTranslations = &Translations{en.Description, ua.Description}
		}
		for _, f := range v.Filters {
			var variant string = f.Variant
			result[i].Filters = append(result[i].Filters,
				[2]interface{}{f.FilterId, FilterVariant{f.Id, f.Slug, &variant, nil}})
		}
	}

	return result, err
}

func HasMoreProducts(request *ProductsRequest) (bool, int, error) {
	tmpl := template.Must(template.New("productsTotalQuery").Parse(`
		SELECT COUNT(*) 
		{{if .Filters}}
			FROM filtered_products AS p
		{{else}}
			FROM products AS p
		{{end}}
		WHERE p.category_id = ${{.Cnt}};
	`))

	args := make([]any, 0)
	filtersQuery := ""
	if len(request.Filters) != 0 {
		filtersQuery, args = createFiltersQuery(request.Filters)
	}

	request.Cnt = len(args) + 1
	args = append(args, request.CategoryId)
	query := filtersQuery + ExecuteTemplate(tmpl, request)

	var total int
	err := pgxscan.Get(db.Ctx, db.Client, &total, query, args...)
	if err != nil {
		return false, 0, err
	}

	hasMore := total > request.Page*PRODUCTS_PER_PAGE
	totalPages := (total + PRODUCTS_PER_PAGE - 1) / PRODUCTS_PER_PAGE

	return hasMore, totalPages, nil
}

type TChangeProduct struct {
	baseProductMutation
	Id string `json:"id" validate:"required"`
}

func ChangeProduct(p *TChangeProduct) error {
	tx, err := db.Client.Begin(db.Ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(db.Ctx)

	_, err = tx.Exec(db.Ctx, `
		UPDATE products 
		SET slug = $1, price = $2
		WHERE id = $3;
	`, p.Slug, p.Price, p.Id)
	if err != nil {
		return err
	}

	_, err = tx.Exec(db.Ctx, `
		UPDATE product_translations 
		SET title = $1, description = $2
		WHERE product_id = $3 AND lang = $4;
	`, p.Title.En, p.Description.En, p.Id, Languages.En)
	if err != nil {
		return err
	}

	_, err = tx.Exec(db.Ctx, `
		UPDATE product_translations 
		SET title = $1, description = $2
		WHERE product_id = $3 AND lang = $4;
	`, p.Title.Ua, p.Description.Ua, p.Id, Languages.Ua)
	if err != nil {
		return err
	}

	_, err = tx.Exec(db.Ctx, `
		DELETE FROM product_filters
		WHERE product_id = $1;
	`, p.Id)
	if err != nil {
		return err
	}

	_, err = tx.Exec(db.Ctx, `
		DELETE FROM product_images
		WHERE product_id = $1;
	`, p.Id)
	if err != nil {
		return err
	}

	if err := addProductFilters(&tx, p.Id, p.Filters); err != nil {
		return err
	}

	if err := addProductImages(&tx, p.Id, p.Images); err != nil {
		return err
	}

	return tx.Commit(db.Ctx)
}

func DeleteProduct(id string) error {
	_, err := db.Client.Exec(db.Ctx, `
		DELETE FROM products WHERE id = $1;
	`, id)
	return err
}

func GetPopularProducts(category string, lang Language) ([]Product, error) {
	tmpl := template.Must(template.New("popularProductsQuery").Parse(`
		WITH RECURSIVE CategoryHierarchy AS (
			SELECT c.id, c.parent_id
			FROM categories AS c
			{{if .}}
				WHERE c.slug = $2
			{{else}}
				WHERE c.parent_id IS NULL
			{{end}}

			UNION ALL

			SELECT c.id, c.parent_id
			FROM categories AS c
			JOIN CategoryHierarchy AS ch ON c.parent_id = ch.id
		)

		SELECT p.id, p.slug, p.price, pt.title, pt.description,
			json_agg(DISTINCT jsonb_build_object(
				'id', pi.id, 'imageUrl', pi.image_url, 'width', pi.width, 'height', pi.height
			)) AS images,
			COALESCE(SUM(o.quantity), 0) AS popularity,
			COALESCE(AVG(r.rating), 0) AS rating,
			COUNT(r.*) AS reviews
		FROM products AS p
		JOIN CategoryHierarchy AS c ON p.category_id = c.id
		LEFT JOIN product_translations AS pt ON p.id = pt.product_id AND pt.lang = $1
		LEFT JOIN product_images AS pi ON p.id = pi.product_id
		LEFT JOIN order_content AS o ON p.id = o.product_id
		LEFT JOIN reviews AS r ON p.id = r.product_id
		GROUP BY p.id, pt.title, pt.description
		ORDER BY popularity DESC, rating DESC
		LIMIT 12;
	`))

	result := make([]Product, 0)
	query := ExecuteTemplate(tmpl, category)
	args := []interface{}{lang}
	if category != "" {
		args = append(args, category)
	}

	err := pgxscan.Select(db.Ctx, db.Client, &result, query, args...)
	return result, err
}
