.PHONY: help
.DEFAULT_GOAL := help
help:
	@echo ""
	@echo "Usage:"
	@echo "  make <target>"
	@echo ""
	@echo "Dev:"
	@echo "  make install        - install all dependencies"
	@echo ""
	@echo "Run:"
	@echo "  make run-desktop    - run desktop app"
	@echo ""
	@echo "Utils"
	@echo "  make help           - show this help"
	@echo ""

#%% Run
.PHONY: run-frontend
run-desktop:
	cd packages/desktop && npm run start

.PHONY: install
install:
	npm install --include=dev
	npx lerna bootstrap

.PHONY: clean
clean:
	npx lerna clean
