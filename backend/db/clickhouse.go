package db

import (
	"context"
	"crypto/tls"
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2"
	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"
)

// Client represents a ClickHouse database client
type Client struct {
	db     driver.Conn
	sqlDB  *sql.DB
	config *Config
}

// NewClient creates a new ClickHouse client
func NewClient(config *Config) (*Client, error) {
	if config == nil {
		config = NewConfigFromEnv()
	}

	// Create ClickHouse connection options
	options := &clickhouse.Options{
		Addr: []string{fmt.Sprintf("%s:%d", config.Host, config.Port)},
		Auth: clickhouse.Auth{
			Database: config.Database,
			Username: config.Username,
			Password: config.Password,
		},
		Settings: clickhouse.Settings{
			"max_execution_time": 60,
		},
		Compression: &clickhouse.Compression{
			Method: clickhouse.CompressionLZ4,
		},
		DialTimeout: time.Duration(10) * time.Second,
		ClientInfo: clickhouse.ClientInfo{
			Products: []struct {
				Name    string
				Version string
			}{
				{Name: "rebnb-backend", Version: "0.1"},
			},
		},
	}

	// Enable compression if configured
	if !config.Compression {
		options.Compression = &clickhouse.Compression{
			Method: clickhouse.CompressionNone,
		}
	}

	// Enable SSL if configured
	if config.SSL {
		options.TLS = &tls.Config{
			InsecureSkipVerify: true, // In production, set this to false and configure proper certificates
		}
	}

	// Enable debug mode if configured
	if config.Debug {
		options.Debugf = func(format string, v ...interface{}) {
			fmt.Printf(format, v...)
		}
	}

	// Create native connection
	conn, err := clickhouse.Open(options)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to ClickHouse: %w", err)
	}

	// Test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := conn.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping ClickHouse: %w", err)
	}

	// Also create SQL DB connection for standard database/sql interface
	sqlDB := clickhouse.OpenDB(options)
	sqlDB.SetMaxOpenConns(config.MaxOpenConns)
	sqlDB.SetMaxIdleConns(config.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(config.ConnMaxLifetime)
	sqlDB.SetConnMaxIdleTime(config.ConnMaxIdleTime)

	client := &Client{
		db:     conn,
		sqlDB:  sqlDB,
		config: config,
	}

	log.Printf("✅ Connected to ClickHouse at %s:%d/%s", config.Host, config.Port, config.Database)

	return client, nil
}

// Close closes the ClickHouse connection
func (c *Client) Close() error {
	if c.sqlDB != nil {
		if err := c.sqlDB.Close(); err != nil {
			log.Printf("Error closing SQL DB connection: %v", err)
		}
	}

	if c.db != nil {
		if err := c.db.Close(); err != nil {
			log.Printf("Error closing native connection: %v", err)
			return err
		}
	}

	log.Println("🔌 Disconnected from ClickHouse")
	return nil
}

// Ping tests the connection to ClickHouse
func (c *Client) Ping(ctx context.Context) error {
	return c.db.Ping(ctx)
}

// GetNativeConn returns the native ClickHouse connection for advanced operations
func (c *Client) GetNativeConn() driver.Conn {
	return c.db
}

// GetSQLDB returns the standard sql.DB interface
func (c *Client) GetSQLDB() *sql.DB {
	return c.sqlDB
}

// GetConfig returns the client configuration
func (c *Client) GetConfig() *Config {
	return c.config
}

// Health checks the health of the ClickHouse connection
func (c *Client) Health(ctx context.Context) error {
	// Test with a simple query
	var result uint64
	if err := c.db.QueryRow(ctx, "SELECT 1").Scan(&result); err != nil {
		return fmt.Errorf("health check failed: %w", err)
	}

	if result != 1 {
		return fmt.Errorf("health check returned unexpected result: %d", result)
	}

	return nil
}

// GetServerVersion returns the ClickHouse server version
func (c *Client) GetServerVersion(ctx context.Context) (string, error) {
	var version string
	if err := c.db.QueryRow(ctx, "SELECT version()").Scan(&version); err != nil {
		return "", fmt.Errorf("failed to get server version: %w", err)
	}
	return version, nil
}

// GetServerInfo returns basic server information
func (c *Client) GetServerInfo(ctx context.Context) (map[string]interface{}, error) {
	info := make(map[string]interface{})

	// Get version
	version, err := c.GetServerVersion(ctx)
	if err != nil {
		return nil, err
	}
	info["version"] = version

	// Get uptime
	var uptime uint64
	if err := c.db.QueryRow(ctx, "SELECT uptime()").Scan(&uptime); err != nil {
		return nil, fmt.Errorf("failed to get uptime: %w", err)
	}
	info["uptime"] = uptime

	// Get current database
	var currentDB string
	if err := c.db.QueryRow(ctx, "SELECT currentDatabase()").Scan(&currentDB); err != nil {
		return nil, fmt.Errorf("failed to get current database: %w", err)
	}
	info["current_database"] = currentDB

	return info, nil
}
