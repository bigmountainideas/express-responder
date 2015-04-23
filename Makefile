REPORTER=spec

all: test docs

docs:
	@./node_modules/.bin/docco \
	lib/*.js

test:
	@./node_modules/.bin/mocha \
		--reporter $(REPORTER)

.PHONY: all test docs
