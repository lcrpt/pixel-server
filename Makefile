deps:
	yarn install

.ONESHELL:
test:
	@ ./node_modules/.bin/mocha --timeout 10000 -r ./tests/init.js ./tests/hooks "src/**/*.spec.js"

.ONESHELL:
test-watch:
	@ ./node_modules/.bin/mocha --timeout 10000 -w -r ./tests/init.js ./tests/hooks "src/**/*.spec.js"

.ONESHELL:
test-cover:
	@ node ./node_modules/.bin/istanbul cover -x "src/**/*.spec.js" ./node_modules/.bin/_mocha -- --timeout 5000 -r ./tests/init.js ./tests/hooks "src/**/*.spec.js"

.ONESHELL:
run:
	@ node src/

.ONESHELL:
run-watch:
	@ nodemon --ext js src/


.ONESHELL:
dev:
	@ export $$(cat .env.dev); node src/

.ONESHELL:
dev-watch:
	@ export $$(cat .env.dev); nodemon --ext js src/

lint:
	@ ./node_modules/.bin/eslint src

lint-watch:
	@ nodemon --exec './node_modules/.bin/eslint src'
