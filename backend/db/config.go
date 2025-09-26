package db

import (
	"os"
	"strconv"
	"time"
)

// Config holds database configuration
type Config struct {
	URI            string
	Database       string
	Debug          bool
	MaxPoolSize    uint64
	MinPoolSize    uint64
	ConnectTimeout time.Duration
	ServerTimeout  time.Duration
}

// NewConfigFromEnv creates a new config from environment variables
func NewConfigFromEnv() *Config {
	// Primary configuration - just connection string and database name
	uri := getEnvOrDefault("MONGODB_URI", "mongodb://admin:euclid_testnet@43.205.95.210:27017/?directConnection=true")
	database := getEnvOrDefault("MONGODB_DATABASE", "ethglobal")

	// Optional advanced settings with defaults
	maxPoolSize := uint64(10)
	if maxPoolStr := os.Getenv("MONGODB_MAX_POOL_SIZE"); maxPoolStr != "" {
		if p, err := strconv.ParseUint(maxPoolStr, 10, 64); err == nil {
			maxPoolSize = p
		}
	}

	minPoolSize := uint64(2)
	if minPoolStr := os.Getenv("MONGODB_MIN_POOL_SIZE"); minPoolStr != "" {
		if p, err := strconv.ParseUint(minPoolStr, 10, 64); err == nil {
			minPoolSize = p
		}
	}

	debug := false
	if debugStr := os.Getenv("MONGODB_DEBUG"); debugStr == "true" {
		debug = true
	}

	return &Config{
		URI:            uri,
		Database:       database,
		Debug:          debug,
		MaxPoolSize:    maxPoolSize,
		MinPoolSize:    minPoolSize,
		ConnectTimeout: time.Duration(10) * time.Second,
		ServerTimeout:  time.Duration(30) * time.Second,
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
