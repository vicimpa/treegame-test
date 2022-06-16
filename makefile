M:=${shell pwd}/node_modules/.bin/

all:
	@${M}webpack serve

build:
	@env NODE_ENV=production ${M}webpack