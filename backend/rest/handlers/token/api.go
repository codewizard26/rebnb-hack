package token

import (
	"context"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"path/filepath"
	"rebnb/db"
	"strconv"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/gin-gonic/gin"
)

// MintRequest represents the request payload for minting a property token
type MintRequest struct {
	To         string `json:"to" binding:"required"`
	PropertyId string `json:"propertyId" binding:"required"`
}

// MintTransactionData represents the transaction data for the mint function
type MintTransactionData struct {
	ChainId string `json:"chainId"`
	To      string `json:"to"`
	Data    string `json:"data"`
	Value   string `json:"value"`
}

// MintResponse represents the response for the mint endpoint
type TxnResponse struct {
	Msg MintTransactionData `json:"msg"`
}

// Chain represents chain data from the database
type Chain struct {
	Chain   string `json:"chain" db:"chain"`
	RPC     string `json:"rpc" db:"rpc"`
	ChainID string `json:"chain_id" db:"chain_id"`
}

// ChainResponse represents the response for the chain endpoint
type ChainResponse struct {
	Success bool   `json:"success"`
	Data    *Chain `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
}

type ListingRequest struct {
	PropertyId      string `json:"propertyId"`
	Date            string `json:"date"`
	RentPrice       string `json:"rentPrice"`
	RentSecurity    string `json:"rentSecurity"`
	BookingPrice    string `json:"bookingPrice"`
	BookingSecurity string `json:"bookingSecurity"`
}

func CreateListing(c *gin.Context) {
	var request ListingRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request payload: " + err.Error(),
		})
		return
	}

	// Validate all required fields
	if request.PropertyId == "" || request.Date == "" || request.RentPrice == "" ||
		request.RentSecurity == "" || request.BookingPrice == "" || request.BookingSecurity == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "All fields are required: propertyId, date, rentPrice, rentSecurity, bookingPrice, bookingSecurity",
		})
		return
	}

	// Convert and validate propertyId
	propertyIdInt, err := strconv.ParseUint(request.PropertyId, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid propertyId: must be a valid number",
		})
		return
	}

	// Convert and validate date
	dateInt, err := strconv.ParseUint(request.Date, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid date: must be a valid timestamp",
		})
		return
	}

	// Convert and validate rent price
	rentPriceInt, err := strconv.ParseUint(request.RentPrice, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid rentPrice: must be a valid number",
		})
		return
	}

	// Convert and validate rent security
	rentSecurityInt, err := strconv.ParseUint(request.RentSecurity, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid rentSecurity: must be a valid number",
		})
		return
	}

	// Convert and validate booking price
	bookingPriceInt, err := strconv.ParseUint(request.BookingPrice, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid bookingPrice: must be a valid number",
		})
		return
	}

	// Convert and validate booking security
	bookingSecurityInt, err := strconv.ParseUint(request.BookingSecurity, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid bookingSecurity: must be a valid number",
		})
		return
	}

	// Load the marketplace contract ABI
	contractABI, err := loadMarketPlaceABI()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to load contract ABI: " + err.Error(),
		})
		return
	}

	// Convert parameters to proper big.Int types for ABI encoding
	propertyId := new(big.Int).SetUint64(propertyIdInt)
	date := new(big.Int).SetUint64(dateInt)
	rentPrice := new(big.Int).SetUint64(rentPriceInt)
	rentSecurity := new(big.Int).SetUint64(rentSecurityInt)
	bookingPrice := new(big.Int).SetUint64(bookingPriceInt)
	bookingSecurity := new(big.Int).SetUint64(bookingSecurityInt)

	// Encode the function call using ABI
	data, err := contractABI.Pack("createListing", propertyId, date, rentPrice, rentSecurity, bookingPrice, bookingSecurity)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to encode function call: " + err.Error(),
		})
		return
	}

	// Get chain configuration
	chain, err := GetChain("unichain")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get chain configuration: " + err.Error(),
		})
		return
	}

	contract, err := GetContract("marketplace")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get chain: " + err.Error(),
		})
		return
	}

	// TODO: Get marketplace contract address from configuration
	// For now, using a placeholder - this should be configured properly

	// Create the transaction data
	transactionData := MintTransactionData{
		ChainId: chain.ChainID,
		To:      contract,
		Data:    "0x" + common.Bytes2Hex(data),
		Value:   "0x0", // No ETH value needed for creating listing
	}

	// Create the response
	response := TxnResponse{
		Msg: transactionData,
	}

	c.JSON(http.StatusOK, response)
}

// ABIWrapper represents the structure of the ABI JSON file
type ABIWrapper struct {
	ABI interface{} `json:"abi"`
}

func loadMarketPlaceABI() (*abi.ABI, error) {
	// Get the current working directory and construct the path to the ABI file
	abiPath := filepath.Join("abi", "marketplace.json")

	// Read the ABI file
	abiBytes, err := os.ReadFile(abiPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read ABI file: %v", err)
	}

	// First parse the wrapper to extract the ABI array
	var wrapper ABIWrapper
	if err := json.Unmarshal(abiBytes, &wrapper); err != nil {
		return nil, fmt.Errorf("failed to parse ABI wrapper: %v", err)
	}

	// Convert the ABI interface back to JSON string
	abiJSON, err := json.Marshal(wrapper.ABI)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal ABI: %v", err)
	}

	// Parse the ABI JSON
	contractABI, err := abi.JSON(strings.NewReader(string(abiJSON)))
	if err != nil {
		return nil, fmt.Errorf("failed to parse ABI: %v", err)
	}

	return &contractABI, nil
}

// loadPropertyABI loads the property contract ABI from the JSON file
func loadPropertyABI() (*abi.ABI, error) {
	// Get the current working directory and construct the path to the ABI file
	abiPath := filepath.Join("abi", "property.json")

	// Read the ABI file
	abiBytes, err := os.ReadFile(abiPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read ABI file: %v", err)
	}

	// First parse the wrapper to extract the ABI array
	var wrapper ABIWrapper
	if err := json.Unmarshal(abiBytes, &wrapper); err != nil {
		return nil, fmt.Errorf("failed to parse ABI wrapper: %v", err)
	}

	// Convert the ABI interface back to JSON string
	abiJSON, err := json.Marshal(wrapper.ABI)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal ABI: %v", err)
	}

	// Parse the ABI JSON
	contractABI, err := abi.JSON(strings.NewReader(string(abiJSON)))
	if err != nil {
		return nil, fmt.Errorf("failed to parse ABI: %v", err)
	}

	return &contractABI, nil
}

// CreateMintMessage creates a transaction message for minting a property token
func CreateMintMessage(c *gin.Context) {
	var req MintRequest

	// Bind and validate the request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request payload: " + err.Error(),
		})
		return
	}

	// Validate the address format
	if !common.IsHexAddress(req.To) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid address format",
		})
		return
	}

	// Validate propertyId is a valid number
	propertyIdInt, err := strconv.ParseUint(req.PropertyId, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid propertyId: must be a valid number",
		})
		return
	}

	// Load the contract ABI
	contractABI, err := loadPropertyABI()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to load contract ABI: " + err.Error(),
		})
		return
	}

	// Convert parameters to proper types
	toAddress := common.HexToAddress(req.To)
	propertyId := new(big.Int).SetUint64(propertyIdInt)

	// Encode the function call using ABI
	data, err := contractABI.Pack("mint", toAddress, propertyId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to encode function call: " + err.Error(),
		})
		return
	}

	chain, err := GetChain("unichain")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get chain: " + err.Error(),
		})
		return
	}

	contract, err := GetContract("property")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get chain: " + err.Error(),
		})
		return
	}

	// Create the transaction data
	transactionData := MintTransactionData{
		ChainId: chain.ChainID, // Base Sepolia testnet chain ID
		To:      contract,
		Data:    "0x" + common.Bytes2Hex(data),
		Value:   "0x0", // No ETH value needed for minting
	}

	// Create the response
	response := TxnResponse{
		Msg: transactionData,
	}

	c.JSON(http.StatusOK, response)
}

// GetChain fetches chain data for a specific chain from MongoDB
func GetChain(chainName string) (*Chain, error) {
	ctx := context.Background()

	// Get chain from MongoDB
	chainDoc, err := db.MongoClient.GetChain(ctx, chainName)
	if err != nil {
		return nil, err
	}

	// Convert to API response format
	chain := &Chain{
		Chain:   chainDoc.Chain,
		RPC:     chainDoc.RPC,
		ChainID: chainDoc.ChainID,
	}

	return chain, nil
}

type Contract struct {
	ContractAddress string `json:"contract_address"`
}

func GetContract(contractType string) (string, error) {
	ctx := context.Background()

	// Check if MongoDB client is initialized
	if db.MongoClient.Client == nil {
		return "", fmt.Errorf("MongoDB client is not initialized")
	}

	// Get contract from MongoDB
	contractDoc, err := db.MongoClient.GetContract(ctx, contractType)
	if err != nil {
		return "", fmt.Errorf("failed to get contract: %w", err)
	}

	return contractDoc.ContractAddress, nil
}
