CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    says text,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
