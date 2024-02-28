package services

import (
	"crypto/tls"
	"fmt"
	"html/template"
	"net/mail"
	"net/smtp"
	"os"
)

func SendEmail(to string, subject, templatePath string, data any) error {
	email := os.Getenv("EMAIL_FROM")
	password := os.Getenv("EMAIL_PASSWORD")
	host := os.Getenv("EMAIL_HOST")
	port := os.Getenv("SMTP_PORT")

	t := template.Must(template.ParseFiles(templatePath))

	from := mail.Address{Name: "VYDELKA", Address: email}
	mailTo := mail.Address{Name: "", Address: to}

	headers := make(map[string]string)
	headers["From"] = from.String()
	headers["To"] = mailTo.String()
	headers["Subject"] = subject
	headers["MIME-version"] = "1.0"
	headers["Content-Type"] = "text/html"

	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n"

	fullHost := host + ":" + port
	auth := smtp.PlainAuth("", email, password, host)

	tlsConfig := &tls.Config{
		InsecureSkipVerify: true,
		ServerName:         host,
	}

	conn, err := tls.Dial("tcp", fullHost, tlsConfig)
	if err != nil {
		return err
	}

	c, err := smtp.NewClient(conn, host)
	if err != nil {
		return err
	}

	if err = c.Auth(auth); err != nil {
		return err
	}

	if err = c.Mail(from.Address); err != nil {
		return err
	}

	if err = c.Rcpt(to); err != nil {
		return err
	}

	w, err := c.Data()
	if err != nil {
		return err
	}

	_, err = w.Write([]byte(message))
	if err != nil {
		return err
	}

	err = t.Execute(w, data)
	if err != nil {
		return err
	}

	err = w.Close()
	if err != nil {
		return err
	}

	return c.Quit()
}
