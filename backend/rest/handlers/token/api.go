package token

import (
	"bytes"
	"context"
	"crypto/ecdsa"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"path/filepath"
	"rebnb/db"
	"strconv"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/gin-gonic/gin"
)

// MintRequest represents the request payload for minting a property token
type MintRequest struct {
	PropertyName    string      `json:"property_name" binding:"required"`
	PropertyAddress string      `json:"property_address" binding:"required"`
	Description     string      `json:"description" binding:"required"`
	Services        []string    `json:"services"`
	Images          []string    `json:"images"`
	To              string      `json:"to" binding:"required"`
	ExternalUrl     string      `json:"external_url,omitempty"`
	Attributes      []Attribute `json:"attributes,omitempty"`
	// PrivateKey      string      `json:"privateKey" binding:"required"`
	// Broadcast bool `json:"broadcast,omitempty"`
}

// Attribute represents NFT metadata attributes
type Attribute struct {
	TraitType   string `json:"trait_type"`
	Value       string `json:"value"`
	DisplayType string `json:"display_type,omitempty"`
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

// MintWithIPFSResponse represents the response for the mint with IPFS endpoint
type MintWithIPFSResponse struct {
	IPFSHash        string              `json:"ipfs_hash,omitempty"`
	TokenURI        string              `json:"token_uri,omitempty"`
	TransactionHash string              `json:"transaction_hash,omitempty"`
	Receipt         *TransactionReceipt `json:"receipt,omitempty"`
	PropertyId      string              `json:"property_id,omitempty"`
	Error           string              `json:"error,omitempty"`
}

// TransactionReceipt represents a simplified transaction receipt
type TransactionReceipt struct {
	TransactionHash  string `json:"transaction_hash"`
	BlockNumber      uint64 `json:"block_number"`
	BlockHash        string `json:"block_hash"`
	GasUsed          uint64 `json:"gas_used"`
	Status           uint64 `json:"status"` // 1 for success, 0 for failure
	ContractAddress  string `json:"contract_address,omitempty"`
	TransactionIndex uint   `json:"transaction_index"`
}

// GetReceiptRequest represents the request for getting a transaction receipt
type GetReceiptRequest struct {
	TransactionHash string `json:"transaction_hash" binding:"required"`
	ChainName       string `json:"chain_name,omitempty"` // defaults to "unichain"
}

// GetReceiptResponse represents the response for getting a transaction receipt
type GetReceiptResponse struct {
	Receipt *TransactionReceipt `json:"receipt,omitempty"`
	Error   string              `json:"error,omitempty"`
}

// PinataResponse represents the response from Pinata API
type PinataResponse struct {
	IPFSHash    string `json:"IpfsHash"`
	PinSize     int    `json:"PinSize"`
	Timestamp   string `json:"Timestamp"`
	IsDuplicate bool   `json:"isDuplicate"`
}

// NFTMetadata represents the NFT metadata structure
type NFTMetadata struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Image       string      `json:"image"`
	ExternalURL string      `json:"external_url,omitempty"`
	Attributes  []Attribute `json:"attributes,omitempty"`
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

// // CreateMintMessage creates a transaction meVjssage for minting a property token
// func CreateMintMessage(c *gin.Context) {
// 	var req MintRequest

// 	// Bind and validate the request
// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{
// 			"error": "Invalid request payload: " + err.Error(),
// 		})
// 		return
// 	}

// 	// Validate the address format
// 	if !common.IsHexAddress(req.To) {
// 		c.JSON(http.StatusBadRequest, gin.H{
// 			"error": "Invalid address format",
// 		})
// 		return
// 	}

// 	// Validate propertyId is a valid number
// 	propertyIdInt, err := strconv.ParseUint(req.PropertyId, 10, 64)
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{
// 			"error": "Invalid propertyId: must be a valid number",
// 		})
// 		return
// 	}

// 	// Load the contract ABI
// 	contractABI, err := loadPropertyABI()
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{
// 			"error": "Failed to load contract ABI: " + err.Error(),
// 		})
// 		return
// 	}

// 	// Convert parameters to proper types
// 	toAddress := common.HexToAddress(req.To)
// 	propertyId := new(big.Int).SetUint64(propertyIdInt)

// 	// Encode the function call using ABI
// 	data, err := contractABI.Pack("mint", toAddress, propertyId)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{
// 			"error": "Failed to encode function call: " + err.Error(),
// 		})
// 		return
// 	}

// 	chain, err := GetChain("unichain")
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{
// 			"error": "Failed to get chain: " + err.Error(),
// 		})
// 		return
// 	}

// 	contract, err := GetContract("property")
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{
// 			"error": "Failed to get chain: " + err.Error(),
// 		})
// 		return
// 	}

// 	// Create the transaction data
// 	transactionData := MintTransactionData{
// 		ChainId: chain.ChainID, // Base Sepolia testnet chain ID
// 		To:      contract,
// 		Data:    "0x" + common.Bytes2Hex(data),
// 		Value:   "0x0", // No ETH value needed for minting
// 	}

// 	// Create the response
// 	response := TxnResponse{
// 		Msg: transactionData,
// 	}

// 	c.JSON(http.StatusOK, response)
// }

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

// uploadToIPFS uploads JSON metadata to Pinata IPFS
func uploadToIPFS(metadata NFTMetadata, pinataJWT string) (*PinataResponse, error) {

	// Create the request payload for Pinata
	pinataPayload := map[string]interface{}{
		"pinataOptions": map[string]interface{}{
			"cidVersion": 1,
		},
		"pinataMetadata": map[string]interface{}{
			"name": fmt.Sprintf("%s.json", metadata.Name),
		},
		"pinataContent": metadata,
	}

	url := "https://api.pinata.cloud/pinning/pinJSONToIPFS"

	// Convert metadata to JSON
	jsonData, err := json.Marshal(pinataPayload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal metadata: %w", err)
	}

	// Create the request
	req, err := http.NewRequestWithContext(context.Background(), "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("pinata_api_key", os.Getenv("PINATA_API_KEY"))
	req.Header.Set("pinata_secret_api_key", os.Getenv("PINATA_SECRET_API_KEY"))
	fmt.Println(req.Header)

	// Make the request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("pinata API returned status %d", resp.StatusCode)
	}

	// Parse response
	var pinataResp PinataResponse
	if err := json.NewDecoder(resp.Body).Decode(&pinataResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	return &pinataResp, nil
}

// broadcastTransaction broadcasts a transaction to the blockchain
func broadcastTransaction(rpcURL string, privateKeyHex string, to common.Address, data []byte, chainID *big.Int) (string, error) {
	// Connect to the blockchain
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return "", fmt.Errorf("failed to connect to blockchain: %v", err)
	}
	defer client.Close()

	// Parse private key
	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		return "", fmt.Errorf("failed to parse private key: %v", err)
	}

	// Get public key and address
	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return "", fmt.Errorf("error casting public key to ECDSA")
	}

	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)

	// Get nonce
	nonce, err := client.PendingNonceAt(context.Background(), fromAddress)
	if err != nil {
		return "", fmt.Errorf("failed to get nonce: %v", err)
	}

	// Get gas price
	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err != nil {
		return "", fmt.Errorf("failed to get gas price: %v", err)
	}

	// Estimate gas limit
	gasLimit, err := client.EstimateGas(context.Background(), ethereum.CallMsg{
		From: fromAddress,
		To:   &to,
		Data: data,
	})
	if err != nil {
		return "", fmt.Errorf("failed to estimate gas: %v", err)
	}

	// Create transaction
	tx := types.NewTransaction(nonce, to, big.NewInt(0), gasLimit, gasPrice, data)

	// Sign transaction
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), privateKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign transaction: %v", err)
	}

	// Send transaction
	err = client.SendTransaction(context.Background(), signedTx)
	if err != nil {
		return "", fmt.Errorf("failed to send transaction: %v", err)
	}

	return signedTx.Hash().Hex(), nil
}

// CreateMintWithIPFS creates a mint transaction with IPFS metadata upload and optional broadcasting
func CreateMintMessage(c *gin.Context) {
	var req MintRequest

	// Bind and validate the request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, MintWithIPFSResponse{
			Error: "Invalid request payload: " + err.Error(),
		})
		return
	}

	// Validate the address format
	if !common.IsHexAddress(req.To) {
		c.JSON(http.StatusBadRequest, MintWithIPFSResponse{
			Error: "Invalid address format",
		})
		return
	}
	ppId := fmt.Sprintf("%08d", time.Now().UnixNano()%1e8)

	// Validate propertyId is a valid number
	propertyIdInt, err := strconv.ParseUint(ppId, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, MintWithIPFSResponse{
			Error: "Invalid propertyId: must be a valid number",
		})
		return
	}

	// Get Pinata JWT from environment
	pinataJWT := os.Getenv("PINATA_JWT")
	if pinataJWT == "" {
		c.JSON(http.StatusInternalServerError, MintWithIPFSResponse{
			Error: "Pinata JWT not configured",
		})
		return
	}

	// Create NFT metadata
	metadata := NFTMetadata{
		Name:        req.PropertyName,
		Description: req.Description,
		ExternalURL: req.ExternalUrl,
		Attributes:  req.Attributes,
	}

	// Set image URL if provided
	if len(req.Images) > 0 {
		metadata.Image = req.Images[0]
	}

	// Add default attributes if none provided
	if len(metadata.Attributes) == 0 {
		metadata.Attributes = []Attribute{
			{
				TraitType: "property_id",
				Value:     ppId,
			},
			{
				TraitType:   "date_of_mint",
				Value:       fmt.Sprintf("%d", time.Now().Unix()),
				DisplayType: "date",
			},
			{
				TraitType: "property_address",
				Value:     req.PropertyAddress,
			},
		}
	}

	// Upload to IPFS via Pinata
	pinataResp, err := uploadToIPFS(metadata, pinataJWT)
	if err != nil {
		c.JSON(http.StatusInternalServerError, MintWithIPFSResponse{
			Error: "Failed to upload to IPFS: " + err.Error(),
		})
		return
	}

	// Create token URI
	tokenURI := fmt.Sprintf("https://pink-improved-swift-480.mypinata.cloud/ipfs/%s", pinataResp.IPFSHash)

	// Load the contract ABI
	contractABI, err := loadPropertyABI()
	if err != nil {
		c.JSON(http.StatusInternalServerError, MintWithIPFSResponse{
			Error: "Failed to load contract ABI: " + err.Error(),
		})
		return
	}

	// Convert parameters to proper types
	toAddress := common.HexToAddress(req.To)
	propertyId := new(big.Int).SetUint64(propertyIdInt)

	// Encode the function call using ABI (assuming mint function takes to, propertyId, tokenURI)
	data, err := contractABI.Pack("mint", toAddress, propertyId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, MintWithIPFSResponse{
			Error: "Failed to encode function call: " + err.Error(),
		})
		return
	}

	// Get chain and contract configuration
	chain, err := GetChain("unichain")
	if err != nil {
		c.JSON(http.StatusInternalServerError, MintWithIPFSResponse{
			Error: "Failed to get chain: " + err.Error(),
		})
		return
	}

	contractAddress, err := GetContract("property")
	if err != nil {
		c.JSON(http.StatusInternalServerError, MintWithIPFSResponse{
			Error: "Failed to get contract: " + err.Error(),
		})
		return
	}

	// Create the transaction data

	response := MintWithIPFSResponse{
		IPFSHash:   pinataResp.IPFSHash,
		TokenURI:   tokenURI,
		PropertyId: ppId,
	}

	privateKey := os.Getenv(
		"PRIVATE_KEY",
	)

	// If broadcast is requested, send the transaction
	if privateKey != "" {
		// Remove 0x prefix if present
		privateKey := strings.TrimPrefix(privateKey, "0x")

		// Parse chain ID
		chainID, success := new(big.Int).SetString(chain.ChainID, 0)
		if !success {
			c.JSON(http.StatusInternalServerError, MintWithIPFSResponse{
				Error: "Invalid chain ID format",
			})
			return
		}

		// Add debugging information
		fmt.Printf("DEBUG: Contract address: %s\n", contractAddress)
		fmt.Printf("DEBUG: Chain ID: %s\n", chain.ChainID)
		fmt.Printf("DEBUG: RPC URL: %s\n", chain.RPC)

		// Broadcast transaction
		txHash, err := broadcastTransaction(
			chain.RPC,
			privateKey,
			common.HexToAddress(contractAddress),
			data,
			chainID,
		)
		if err != nil {
			response.Error = "Failed to broadcast transaction: " + err.Error()
			fmt.Printf("DEBUG: Transaction error: %s\n", err.Error())
		}
		response.TransactionHash = txHash
	}

	c.JSON(http.StatusOK, response)
}
