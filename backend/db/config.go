package db

import (
	"os"
	"strconv"
	"time"
)

// Config holds database configuration
type Config struct {
	Host            string
	Port            int
	Database        string
	Username        string
	Password        string
	Debug           bool
	SSL             bool
	Compression     bool
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	ConnMaxIdleTime time.Duration
}

// NewConfigFromEnv creates a new config from environment variables
func NewConfigFromEnv() *Config {
	port := 19000
	if portStr := os.Getenv("CLICKHOUSE_PORT"); portStr != "" {
		if p, err := strconv.Atoi(portStr); err == nil {
			port = p
		}
	}

	debug := false
	if debugStr := os.Getenv("CLICKHOUSE_DEBUG"); debugStr == "true" {
		debug = true
	}

	return &Config{
		Host:            getEnvOrDefault("CLICKHOUSE_HOST", "65.109.1.240"),
		Port:            port,
		Database:        getEnvOrDefault("CLICKHOUSE_DATABASE", "ethglobal"),
		Username:        getEnvOrDefault("CLICKHOUSE_USERNAME", "default"),
		Password:        getEnvOrDefault("CLICKHOUSE_PASSWORD", "changeme"),
		Debug:           debug,
		SSL:             false,
		Compression:     getEnvOrDefault("CLICKHOUSE_COMPRESSION", "true") == "true",
		MaxOpenConns:    10,
		MaxIdleConns:    5,
		ConnMaxLifetime: time.Hour,
		ConnMaxIdleTime: time.Minute * 30,
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
