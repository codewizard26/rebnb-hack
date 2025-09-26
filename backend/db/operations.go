package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Contract represents a contract document in MongoDB
type Contract struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Type            string             `bson:"type" json:"type"`
	ContractAddress string             `bson:"contract_address" json:"contract_address"`
	CreatedAt       time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt       time.Time          `bson:"updated_at" json:"updated_at"`
}

// Chain represents a chain document in MongoDB
type Chain struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Chain     string             `bson:"chain" json:"chain"`
	RPC       string             `bson:"rpc" json:"rpc"`
	ChainID   string             `bson:"chain_id" json:"chain_id"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

// QueryResult represents a query result with metadata
type QueryResult struct {
	Data  []map[string]interface{} `json:"data"`
	Count int64                    `json:"count"`
}

// InsertResult represents an insert operation result
type InsertResult struct {
	InsertedCount int64                `json:"inserted_count"`
	InsertedIDs   []primitive.ObjectID `json:"inserted_ids,omitempty"`
	Error         error                `json:"error,omitempty"`
}

// InitializeCollections creates the necessary collections and indexes if they don't exist
func (c *Client) InitializeCollections(ctx context.Context) error {
	// Create contracts collection with unique index on type
	contractsCollection := c.GetCollection("contracts")

	// Create unique index on type field
	contractsIndexModel := mongo.IndexModel{
		Keys:    bson.D{{Key: "type", Value: 1}},
		Options: options.Index().SetUnique(true),
	}

	if _, err := contractsCollection.Indexes().CreateOne(ctx, contractsIndexModel); err != nil {
		// Index might already exist, log but don't fail
		log.Printf("Info: contracts index creation: %v", err)
	}

	// Create chains collection with unique index on chain
	chainsCollection := c.GetCollection("chains")

	// Create unique index on chain field
	chainsIndexModel := mongo.IndexModel{
		Keys:    bson.D{{Key: "chain", Value: 1}},
		Options: options.Index().SetUnique(true),
	}

	if _, err := chainsCollection.Indexes().CreateOne(ctx, chainsIndexModel); err != nil {
		// Index might already exist, log but don't fail
		log.Printf("Info: chains index creation: %v", err)
	}

	return nil
}

// SeedInitialData inserts initial data into the collections
func (c *Client) SeedInitialData(ctx context.Context) error {
	now := time.Now()

	// Check if contracts collection has data
	contractsCollection := c.GetCollection("contracts")
	contractCount, err := contractsCollection.CountDocuments(ctx, bson.D{})
	if err != nil {
		return fmt.Errorf("failed to check contracts count: %w", err)
	}

	// Insert initial contract data if collection is empty
	if contractCount == 0 {
		contracts := []interface{}{
			Contract{
				Type:            "marketplace",
				ContractAddress: "0x...", // Replace with actual marketplace contract address
				CreatedAt:       now,
				UpdatedAt:       now,
			},
			Contract{
				Type:            "property",
				ContractAddress: "0x...", // Replace with actual property contract address
				CreatedAt:       now,
				UpdatedAt:       now,
			},
		}

		if _, err := contractsCollection.InsertMany(ctx, contracts); err != nil {
			return fmt.Errorf("failed to insert initial contracts: %w", err)
		}
	}

	// Check if chains collection has data
	chainsCollection := c.GetCollection("chains")
	chainCount, err := chainsCollection.CountDocuments(ctx, bson.D{})
	if err != nil {
		return fmt.Errorf("failed to check chains count: %w", err)
	}

	// Insert initial chain data if collection is empty
	if chainCount == 0 {
		chains := []interface{}{
			Chain{
				Chain:     "unichain",
				RPC:       "https://sepolia.unichain.org",
				ChainID:   "1301",
				CreatedAt: now,
				UpdatedAt: now,
			},
		}

		if _, err := chainsCollection.InsertMany(ctx, chains); err != nil {
			return fmt.Errorf("failed to insert initial chains: %w", err)
		}
	}

	return nil
}

// GetContract retrieves a contract by type
func (c *Client) GetContract(ctx context.Context, contractType string) (*Contract, error) {
	collection := c.GetCollection("contracts")

	var contract Contract
	filter := bson.D{{Key: "type", Value: contractType}}

	if err := collection.FindOne(ctx, filter).Decode(&contract); err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("contract type '%s' not found", contractType)
		}
		return nil, fmt.Errorf("failed to get contract: %w", err)
	}

	return &contract, nil
}

// GetChain retrieves a chain by name
func (c *Client) GetChain(ctx context.Context, chainName string) (*Chain, error) {
	collection := c.GetCollection("chains")

	var chain Chain
	filter := bson.D{{Key: "chain", Value: chainName}}

	if err := collection.FindOne(ctx, filter).Decode(&chain); err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("chain '%s' not found", chainName)
		}
		return nil, fmt.Errorf("failed to get chain: %w", err)
	}

	return &chain, nil
}

// UpdateContractAddress updates a contract address in the database
func (c *Client) UpdateContractAddress(ctx context.Context, contractType, contractAddress string) error {
	collection := c.GetCollection("contracts")

	filter := bson.D{{Key: "type", Value: contractType}}
	update := bson.D{
		{Key: "$set", Value: bson.D{
			{Key: "contract_address", Value: contractAddress},
			{Key: "updated_at", Value: time.Now()},
		}},
	}

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update contract address: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("contract type '%s' not found", contractType)
	}

	return nil
}

// InsertOrUpdateContract inserts a new contract or updates existing one
func (c *Client) InsertOrUpdateContract(ctx context.Context, contractType, contractAddress string) error {
	collection := c.GetCollection("contracts")
	now := time.Now()

	filter := bson.D{{Key: "type", Value: contractType}}
	update := bson.D{
		{Key: "$set", Value: bson.D{
			{Key: "type", Value: contractType},
			{Key: "contract_address", Value: contractAddress},
			{Key: "updated_at", Value: now},
		}},
		{Key: "$setOnInsert", Value: bson.D{
			{Key: "created_at", Value: now},
		}},
	}

	opts := options.Update().SetUpsert(true)

	if _, err := collection.UpdateOne(ctx, filter, update, opts); err != nil {
		return fmt.Errorf("failed to insert or update contract: %w", err)
	}

	return nil
}

// ListCollections returns a list of all collections in the current database
func (c *Client) ListCollections(ctx context.Context) ([]string, error) {
	names, err := c.Database.ListCollectionNames(ctx, bson.D{})
	if err != nil {
		return nil, fmt.Errorf("failed to list collections: %w", err)
	}
	return names, nil
}

// CollectionExists checks if a collection exists
func (c *Client) CollectionExists(ctx context.Context, collectionName string) (bool, error) {
	collections, err := c.ListCollections(ctx)
	if err != nil {
		return false, err
	}

	for _, name := range collections {
		if name == collectionName {
			return true, nil
		}
	}

	return false, nil
}

// DropCollection drops a collection
func (c *Client) DropCollection(ctx context.Context, collectionName string) error {
	collection := c.GetCollection(collectionName)
	return collection.Drop(ctx)
}
