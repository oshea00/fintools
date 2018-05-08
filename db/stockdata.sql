create table stockdata (
 symbol varchar(10),
 csvdata varchar,
 created timestamp default now()
);
create unique index stockdataidx on stockdata(symbol,created);

