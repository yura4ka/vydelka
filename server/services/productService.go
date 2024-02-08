package services

import (
	"fmt"
	"strings"
	"text/template"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/jackc/pgx/v5"
	"github.com/yura4ka/vydelka/db"
)

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

type ProductsRequest struct {
	CategoryId       string
	WithTranslations bool
	Lang             Language
}

type ProductFilter struct {
	Id       string `json:"id"`
	Slug     string `json:"slug"`
	Variant  string `json:"variant"`
	FilterId string `json:"filterId"`
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
}

type productTranslation struct {
	Title       string
	Description string
}

type dbProduct struct {
	Product
	Filters      []ProductFilter `json:"filters"`
	Translations map[Language]productTranslation
}

func GetProducts(request *ProductsRequest) ([]Product, error) {
	tmpl := template.Must(template.New("productsQuery").Parse(`
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
			{{end}}
		FROM products AS p
		LEFT JOIN product_translations AS pt ON p.id = pt.product_id
		{{if not .WithTranslations}}
			AND pt.lang = $1
		{{end}}
		LEFT JOIN product_images AS pi ON p.id = pi.product_id
		LEFT JOIN product_filters AS pf ON p.id = pf.product_id
		LEFT JOIN filter_variants AS fv ON pf.variant_id = fv.id
		LEFT JOIN translation_items AS fti ON fv.variant_translation_item = fti.id
		LEFT JOIN translations AS ft ON fti.id = ft.item_id AND ft.lang = $1
		WHERE p.category_id = $2
		GROUP BY p.id
		{{if not .WithTranslations}}
			, pt.title, pt.description
		{{end}};
	`))

	query := ExecuteTemplate(tmpl, request)

	products := make([]dbProduct, 0)
	err := pgxscan.Select(db.Ctx, db.Client, &products, query, request.Lang, request.CategoryId)
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
			result[i].Filters = append(result[i].Filters,
				[2]interface{}{f.FilterId, FilterVariant{f.Id, f.Slug, &f.Variant, nil}})
		}
	}

	return result, err
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
