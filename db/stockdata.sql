create table stockdata (
 symbol varchar(10),
 csvdata varchar,
 created timestamp default now()
);
create unique index stockdataidx on stockdata(symbol,created);

create extension pgcrypto;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  accountstatus varchar(10),
  confirmationid varchar(40),
  resetid varchar(40),
  password TEXT NOT NULL,
  created timestamp default now()
);

INSERT INTO users (email, password) VALUES (
  'oshea00@gmail.com',
  crypt('secret', gen_salt('bf'))
);

SELECT id 
  FROM users
 WHERE email = 'oshea00@gmail.com' 
   AND password = crypt('johnspassword', password);

update users set password = crypt('newsecret',gen_salt('bf')) where email = 'oshea00@gmail.com';

CREATE TABLE symbols (
  name text,
  symbol text not null unique
);
create index symnameix on symbols(name);

select * from symbols where lower(name) like '%apple%' or lower(symbol) like '%apple%';

create table user_portfolios (
  email text not null unique,
  portfolio text
);

insert into user_portfolios select email from users;


