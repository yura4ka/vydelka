package services

import (
	"fmt"
	"strings"
	"text/template"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
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
	OrderBy          string
	Ids              []string
	Cnt              int
	Search           string
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
			COALESCE(r.rating, 0) AS rating, r.cnt AS reviews
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
		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS cnt, AVG(rating) AS rating
			FROM reviews
			WHERE product_id = p.id
		) r ON TRUE
		WHERE TRUE
		{{if .CategoryId}}
			AND p.category_id = ${{$arg_counter}}
			{{$arg_counter = inc $arg_counter}}
		{{end}}
		{{if .Ids}}
			AND p.id = ANY(${{$arg_counter}}::uuid[])
			{{$arg_counter = inc $arg_counter}}
		{{end}}
		{{if .Search}}
			AND plainto_tsquery(${{.Cnt}}::TEXT::REGCONFIG, ${{$arg_counter}}) @@ pt.search
			{{$arg_counter = inc $arg_counter}}
		{{end}}
		GROUP BY p.id, r.rating, r.cnt
		{{if .Filters}}
			, p.slug, p.price
		{{end}}
		{{if not .WithTranslations}}
			, pt.title, pt.description
		{{end}}
		{{if eq .OrderBy "new"}}
			, p.created_at
			ORDER BY p.created_at DESC
		{{else if eq .OrderBy "rating"}}
			ORDER BY rating DESC, reviews DESC
		{{else if eq .OrderBy "cheap"}}
			ORDER BY p.price ASC
		{{else if eq .OrderBy "expensive"}}
			ORDER BY p.price DESC	
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
	args = append(args, request.Lang)
	request.Cnt = len(args)

	if request.CategoryId != "" {
		args = append(args, request.CategoryId)
	}
	if len(request.Ids) > 0 {
		args = append(args, request.Ids)
	}
	if request.Search != "" {
		args = append(args, request.Search)
	}

	offset := 0
	limit := pgtype.Int4{Int32: PRODUCTS_PER_PAGE}
	if request.Page > 0 {
		offset = (request.Page - 1) * PRODUCTS_PER_PAGE
		limit.Valid = true
	}
	args = append(args, limit, offset)

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

type ProductsTotal struct {
	HasMore    bool
	Total      uint64
	TotalPages uint64
}

func GetTotalProducts(request *ProductsRequest) (*ProductsTotal, error) {
	tmpl := template.Must(template.New("productsTotalQuery").Funcs(template.FuncMap{
		"inc": func(n int) int {
			return n + 1
		},
	}).Parse(`
		{{$arg_counter:=.Cnt}}
		SELECT COUNT(*) 
		{{if .Filters}}
			FROM filtered_products AS p
		{{else}}
			FROM products AS p
		{{end}}
		{{if .Search}}
			LEFT JOIN product_translations AS pt ON p.id = pt.product_id AND lang = ${{$arg_counter}}
			{{$arg_counter = inc $arg_counter}}
		{{end}}
		WHERE TRUE
			{{if .Search}}
				AND plainto_tsquery(${{.Cnt}}::TEXT::REGCONFIG, ${{$arg_counter}}) @@ pt.search
				{{$arg_counter = inc $arg_counter}}
			{{end}}
			{{if .CategoryId}}
				AND p.category_id = ${{$arg_counter}}
				{{$arg_counter = inc $arg_counter}}
			{{end}}
		;
	`))

	args := make([]any, 0)
	filtersQuery := ""
	if len(request.Filters) != 0 {
		filtersQuery, args = createFiltersQuery(request.Filters)
	}

	request.Cnt = len(args) + 1
	if request.Search != "" {
		args = append(args, request.Lang, request.Search)
	}
	if request.CategoryId != "" {
		args = append(args, request.CategoryId)
	}
	query := filtersQuery + ExecuteTemplate(tmpl, request)

	var total uint64
	err := pgxscan.Get(db.Ctx, db.Client, &total, query, args...)
	if err != nil {
		return nil, err
	}

	hasMore := total > uint64(request.Page)*uint64(PRODUCTS_PER_PAGE)
	totalPages := (total + PRODUCTS_PER_PAGE - 1) / PRODUCTS_PER_PAGE

	return &ProductsTotal{HasMore: hasMore, Total: total, TotalPages: totalPages}, nil
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
			COALESCE(r.rating, 0) AS rating, r.cnt AS reviews
		FROM products AS p
		JOIN CategoryHierarchy AS c ON p.category_id = c.id
		LEFT JOIN product_translations AS pt ON p.id = pt.product_id AND pt.lang = $1
		LEFT JOIN product_images AS pi ON p.id = pi.product_id
		LEFT JOIN order_content AS o ON p.id = o.product_id
		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS cnt, AVG(rating) AS rating
			FROM reviews
			WHERE product_id = p.id
		) r ON TRUE
		GROUP BY p.id, pt.title, pt.description, r.rating, r.cnt
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

func GetProductBySlug(slug string, lang Language) (*Product, error) {
	var product Product
	err := pgxscan.Get(db.Ctx, db.Client, &product, `
		SELECT p.id, p.slug, p.price, pt.title, pt.description,
		json_agg(DISTINCT jsonb_build_object(
			'id', pi.id, 'imageUrl', pi.image_url, 'width', pi.width, 'height', pi.height
		)) AS images,
		json_agg(DISTINCT jsonb_build_array(
			jsonb_build_object('id', f.id, 'slug', f.slug, 'title', ft.content), 
			jsonb_build_object('id', fv.id, 'slug', fv.slug, 'variant', vt.content)
		)) AS filters,
		COALESCE(r.rating, 0) AS rating, r.cnt AS reviews
		FROM products AS p
		LEFT JOIN product_translations AS pt ON p.id = pt.product_id AND pt.lang = $1
		LEFT JOIN product_images AS pi ON p.id = pi.product_id
		LEFT JOIN product_filters AS pf ON p.id = pf.product_id
		LEFT JOIN filter_variants AS fv ON pf.variant_id = fv.id
		LEFT JOIN filters AS f ON fv.filter_id = f.id
		LEFT JOIN translation_items AS vti ON fv.variant_translation_item = vti.id
		LEFT JOIN translations AS vt ON vti.id = vt.item_id AND vt.lang = $1
		LEFT JOIN translation_items AS fti ON f.title_translation_item = fti.id
		LEFT JOIN translations AS ft ON fti.id = ft.item_id AND ft.lang = $1
		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS cnt, AVG(rating) AS rating
			FROM reviews
			WHERE product_id = p.id
		) r ON TRUE
		WHERE p.slug = $2
		GROUP BY p.id, pt.title, pt.description, r.rating, r.cnt;
	`, lang, slug)
	if pgxscan.NotFound(err) {
		return nil, nil
	}
	return &product, err
}

func GetProductRoute(slug string, lang Language) ([]CategoryRoute, error) {
	var product struct{ Title, Category string }
	err := pgxscan.Get(db.Ctx, db.Client, &product, `
		SELECT pt.title, c.slug as category 
		FROM products AS p
		LEFT JOIN product_translations AS pt ON p.id = pt.product_id AND lang = $1
		LEFT JOIN categories AS c ON p.category_id = c.id
		WHERE p.slug = $2
	`, lang, slug)
	if err != nil {
		return nil, err
	}

	result, err := GetCategoryRoute(product.Category, lang)
	result = append(result, CategoryRoute{product.Title, slug})

	return result, err
}

func GetRecentProducts(location *string, lang Language) ([]Product, error) {
	result := make([]Product, 0)
	tmpl := template.Must(template.New("recentProducts").Parse(`
		SELECT p.id, p.slug, p.price, pt.title, '' AS description,
			json_agg(DISTINCT jsonb_build_object(
				'id', pi.id, 'imageUrl', pi.image_url, 'width', pi.width, 'height', pi.height
			)) AS images,
			COALESCE(r.rating, 0) AS rating, r.cnt AS reviews
		FROM (
			SELECT DISTINCT ON (c.product_id)
			c.product_id, o.created_at
			FROM orders AS o
			LEFT JOIN order_content AS c ON o.id = c.order_id
			WHERE o.status != 'canceled'
			{{if not (eq . nil)}} AND o.region = $2 {{end}}
			ORDER BY c.product_id, o.created_at DESC
		) c
		LEFT JOIN products AS p ON c.product_id = p.id
		LEFT JOIN product_translations AS pt ON p.id = pt.product_id AND lang = $1
		LEFT JOIN product_images AS pi ON p.id = pi.product_id
		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS cnt, AVG(rating) AS rating
			FROM reviews
			WHERE product_id = p.id
		) r ON TRUE
		GROUP BY p.id, p.slug, p.price, pt.title, pt.description, r.rating, r.cnt, c.created_at
		ORDER BY c.created_at DESC
		LIMIT 12;
	`))

	query := ExecuteTemplate(tmpl, location)
	args := make([]any, 0)
	args = append(args, lang)
	if location != nil {
		args = append(args, location)
	}

	err := pgxscan.Select(db.Ctx, db.Client, &result, query, args...)
	return result, err
}
