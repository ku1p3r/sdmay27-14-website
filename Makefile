PORT ?= 8000
HOST ?= 127.0.0.1

ifeq ($(OS),Windows_NT)
PYTHON ?= python
else
PYTHON ?= python3
endif

.PHONY: serve help

## serve: Serve the site locally at http://localhost:$(PORT)
serve:
	@echo "Serving at http://localhost:$(PORT) (Ctrl+C to stop)"
	$(PYTHON) -m http.server $(PORT) --bind $(HOST)

## help: List available targets
help:
	@echo "make serve            Serve the site at http://localhost:$(PORT)"
	@echo "make serve PORT=9000  Serve on a different port"
