.PHONY: build test docker-build

build:
	go build -o bin/realm-operator ./cmd/main.go

test:
	go test ./...

docker-build:
	docker build -f ../../docker/operator.Dockerfile -t loopstacks/realm-operator:latest .