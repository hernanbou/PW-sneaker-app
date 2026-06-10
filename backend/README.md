# Sneaker Store Backend

API REST em Java 21 + Spring Boot para o projeto academico Sneaker Store.

## Stack

- Java 21
- Spring Boot 3.4.5
- Spring Web
- Spring Data JPA
- Spring Security + JWT
- Bean Validation
- BCrypt
- PostgreSQL
- H2 para desenvolvimento/testes

## Rodar Com H2

Use este modo para testar sem instalar PostgreSQL:

```powershell
cd "D:\Norton -ADSN5\sneaker-store\backend"
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

API:

```text
http://localhost:8080
```

H2 Console:

```text
http://localhost:8080/h2-console
```

JDBC URL:

```text
jdbc:h2:mem:sneaker_store
```

## Rodar Com PostgreSQL

Crie o banco:

```sql
CREATE DATABASE sneaker_store;
```

Depois rode:

```powershell
cd "D:\Norton -ADSN5\sneaker-store\backend"
$env:DB_URL="jdbc:postgresql://localhost:5432/sneaker_store"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="postgres"
.\mvnw.cmd spring-boot:run
```

## Testes

```powershell
cd "D:\Norton -ADSN5\sneaker-store\backend"
.\mvnw.cmd test
```

## Endpoints

Publicos:

```text
POST /auth/register
POST /auth/login
GET  /products
GET  /products/{id}
GET  /products?search=nike
```

Protegidos por JWT:

```text
GET    /auth/me
PUT    /users/me
GET    /cart
POST   /cart/items
DELETE /cart/items/{itemId}
DELETE /cart
POST   /checkout
GET    /orders/me
GET    /orders/{id}
```

Header para endpoints protegidos:

```text
Authorization: Bearer <token>
```

## Exemplos

Cadastro:

```powershell
curl -X POST "http://localhost:8080/auth/register" `
  -H "Content-Type: application/json" `
  -d "{\"fullName\":\"Norton Silva\",\"email\":\"norton@email.com\",\"password\":\"123456\",\"cpf\":\"12345678909\",\"phone\":\"11999999999\",\"cep\":\"01001000\",\"address\":\"Rua Teste\",\"number\":\"100\",\"complement\":\"Apto 1\",\"city\":\"Sao Paulo\",\"state\":\"SP\"}"
```

Login:

```powershell
curl -X POST "http://localhost:8080/auth/login" `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"norton@email.com\",\"password\":\"123456\"}"
```

Adicionar item ao carrinho:

```powershell
curl -X POST "http://localhost:8080/cart/items" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <token>" `
  -d "{\"productId\":1,\"selectedSize\":40,\"quantity\":1}"
```

Checkout Pix:

```powershell
curl -X POST "http://localhost:8080/checkout" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <token>" `
  -d "{\"paymentMethod\":\"PIX\",\"installments\":1}"
```

Checkout cartao em 3x:

```powershell
curl -X POST "http://localhost:8080/checkout" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <token>" `
  -d "{\"paymentMethod\":\"CREDIT_CARD\",\"installments\":3}"
```

## Regras Implementadas

- Senhas sao salvas com BCrypt.
- Senha nunca aparece nas responses.
- CORS liberado para `http://localhost:4200` e `http://127.0.0.1:4200`.
- Produtos sao seedados a partir de `../frontend/public/data/products.json`.
- Ao adicionar item ao carrinho, estoque e reservado.
- Ao remover item ou limpar carrinho, estoque volta.
- Ao finalizar checkout, carrinho e limpo sem devolver estoque.
- Checkout e transacional.
- Valores financeiros usam `BigDecimal`.
- Frete gratis para subtotal maior ou igual a R$ 600,00.
- Frete de R$ 29,90 abaixo de R$ 600,00.
- Pix aplica 15% de desconto.
- Boleto aplica 10% de desconto.
- Cartao em ate 3x aplica 5% de desconto.
- Cartao acima de 3x nao aplica desconto.
- Cartao permite no maximo 10 parcelas.
- Dados sensiveis de cartao nao sao recebidos nem persistidos.
