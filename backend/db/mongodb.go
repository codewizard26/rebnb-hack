package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

// Client represents a MongoDB database client
var MongoClient Client

type Client struct {
	Client   *mongo.Client
	Database *mongo.Database
	Config   *Config
}

// NewClient creates a new MongoDB client
func NewClient(config *Config) (*Client, error) {
	if config == nil {
		config = NewConfigFromEnv()
	}

	// Create MongoDB client options
	clientOptions := options.Client().ApplyURI(config.URI)

	// Set pool size
	clientOptions.SetMaxPoolSize(config.MaxPoolSize)
	clientOptions.SetMinPoolSize(config.MinPoolSize)

	// Set timeouts
	clientOptions.SetConnectTimeout(config.ConnectTimeout)
	clientOptions.SetServerSelectionTimeout(config.ServerTimeout)

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), config.ConnectTimeout)
	defer cancel()

	// Connect to MongoDB
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Test the connection
	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	// Get database
	database := client.Database(config.Database)

	MongoClient = Client{
		Client:   client,
		Database: database,
		Config:   config,
	}

	log.Printf("✅ Connected to MongoDB database: %s", config.Database)

	return &MongoClient, nil
}

// Close closes the MongoDB connection
func (c *Client) Close() error {
	if c.Client != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := c.Client.Disconnect(ctx); err != nil {
			log.Printf("Error closing MongoDB connection: %v", err)
			return err
		}
	}

	log.Println("🔌 Disconnected from MongoDB")
	return nil
}

// Ping tests the connection to MongoDB
func (c *Client) Ping(ctx context.Context) error {
	return c.Client.Ping(ctx, readpref.Primary())
}

// GetClient returns the MongoDB client
func (c *Client) GetClient() *mongo.Client {
	return c.Client
}

// GetDatabase returns the MongoDB database
func (c *Client) GetDatabase() *mongo.Database {
	return c.Database
}

// GetCollection returns a MongoDB collection
func (c *Client) GetCollection(name string) *mongo.Collection {
	return c.Database.Collection(name)
}

// GetConfig returns the client configuration
func (c *Client) GetConfig() *Config {
	return c.Config
}

// Health checks the health of the MongoDB connection
func (c *Client) Health(ctx context.Context) error {
	return c.Ping(ctx)
}

// GetServerInfo returns basic server information
func (c *Client) GetServerInfo(ctx context.Context) (map[string]interface{}, error) {
	info := make(map[string]interface{})

	// Get server status
	var result map[string]interface{}
	if err := c.Database.RunCommand(ctx, map[string]interface{}{"serverStatus": 1}).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to get server status: %w", err)
	}

	if version, ok := result["version"]; ok {
		info["version"] = version
	}

	if uptime, ok := result["uptime"]; ok {
		info["uptime"] = uptime
	}

	info["database"] = c.Config.Database

	return info, nil
}
