package token

import (
	"bytes"
	"context"
	"crypto/ecdsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"mime/multipart"
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
	Image           string      `json:"image"` // Single image instead of array
	To              string      `json:"to" binding:"required"`
	ExternalUrl     string      `json:"external_url,omitempty"`
	Attributes      []Attribute `json:"attributes,omitempty"`
	// PrivateKey      string      `json:"privateKey" binding:"required"`
	// Broadcast bool `json:"broadcast,omitempty"`
}

// ImageUploadResponse represents the response for image upload
type ImageUploadResponse struct {
	Success   bool     `json:"success"`
	ImageURLs []string `json:"image_urls,omitempty"`
	Error     string   `json:"error,omitempty"`
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
	ChainName       string `json:"chain_name,omitempty"` // defaults to "0g"
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

// ListingData represents the complete listing data to be saved to IPFS
type ListingData struct {
	PropertyName    string `json:"property_name"`
	Description     string `json:"description"`
	Image           string `json:"image"`
	Date            string `json:"date"`
	RentPrice       string `json:"rent_price"`
	RentSecurity    string `json:"rent_security"`
	BookingPrice    string `json:"booking_price"`
	BookingSecurity string `json:"booking_security"`
}

// PinataUploadResponse represents Pinata's upload response
type PinataUploadResponse struct {
	IpfsHash  string `json:"IpfsHash"`
	PinSize   int    `json:"PinSize"`
	Timestamp string `json:"Timestamp"`
}

// pinJSONToIPFS pins JSON data to Pinata IPFS using the JSON pinning endpoint
func pinJSONToIPFS(data interface{}) (string, error) {

	// Create the request payload for JSON pinning
	requestPayload := map[string]interface{}{
		"pinataContent": data,
		"pinataMetadata": map[string]interface{}{
			"name": "listing-data",
		},
	}

	// Convert payload to JSON
	jsonPayload, err := json.Marshal(requestPayload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request payload: %v", err)
	}

	// Create request to Pinata JSON pinning endpoint
	req, err := http.NewRequest("POST", "https://api.pinata.cloud/pinning/pinJSONToIPFS", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("pinata_api_key", os.Getenv("PINATA_API_KEY"))
	req.Header.Set("pinata_secret_api_key", os.Getenv("PINATA_SECRET_API_KEY"))

	// Send request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	// Read response
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("pinata API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	// Parse response
	var pinataResp PinataUploadResponse
	err = json.Unmarshal(respBody, &pinataResp)
	if err != nil {
		return "", fmt.Errorf("failed to parse response: %v", err)
	}

	return pinataResp.IpfsHash, nil
}

func CreateListing(c *gin.Context) {
	// Check if MongoDB client is initialized
	if db.MongoClient.Client == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Database connection not available",
		})
		return
	}

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

	ctx := context.Background()

	// Fetch property details from database
	property, err := db.MongoClient.GetPropertyByID(ctx, request.PropertyId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Property not found: " + err.Error(),
		})
		return
	}

	// Create listing data object combining property info with listing attributes
	listingData := ListingData{
		PropertyName:    property.PropertyName,
		Description:     property.Description,
		Image:           property.Image,
		Date:            request.Date,
		RentPrice:       request.RentPrice,
		RentSecurity:    request.RentSecurity,
		BookingPrice:    request.BookingPrice,
		BookingSecurity: request.BookingSecurity,
	}

	// Pin JSON data to IPFS
	ipfsHash, err := pinJSONToIPFS(listingData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to pin data to IPFS: " + err.Error(),
		})
		return
	}

	// Create listing entry in database
	listing := &db.Listing{
		PropertyID: request.PropertyId,
		Date:       request.Date,
		IPFSHash:   ipfsHash,
	}

	err = db.MongoClient.InsertListing(ctx, listing)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to save listing to database: " + err.Error(),
		})
		return
	}

	// Convert and validate numeric fields for blockchain transaction
	propertyIdInt, err := strconv.ParseUint(request.PropertyId, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid propertyId: must be a valid number",
		})
		return
	}

	dateInt, err := strconv.ParseUint(request.Date, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid date: must be a valid timestamp",
		})
		return
	}

	rentPriceInt, err := strconv.ParseUint(request.RentPrice, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid rentPrice: must be a valid number",
		})
		return
	}

	rentSecurityInt, err := strconv.ParseUint(request.RentSecurity, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid rentSecurity: must be a valid number",
		})
		return
	}

	bookingPriceInt, err := strconv.ParseUint(request.BookingPrice, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid bookingPrice: must be a valid number",
		})
		return
	}

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
	chain, err := GetChain("0g")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get chain configuration: " + err.Error(),
		})
		return
	}

	contract, err := GetContract("marketplace")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get contract: " + err.Error(),
		})
		return
	}

	// Create the transaction data
	transactionData := MintTransactionData{
		ChainId: chain.ChainID,
		To:      contract,
		Data:    "0x" + common.Bytes2Hex(data),
		Value:   "0x0", // No ETH value needed for creating listing
	}

	// Create the response including IPFS hash
	response := gin.H{
		"success":     true,
		"ipfs_hash":   ipfsHash,
		"property_id": request.PropertyId,
		"date":        request.Date,
		"transaction": TxnResponse{
			Msg: transactionData,
		},
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

// UploadImages handles multiple image uploads and saves them to the local uploads directory
func UploadImages(c *gin.Context) {
	// Parse multipart form with max memory of 32MB
	err := c.Request.ParseMultipartForm(32 << 20)
	if err != nil {
		c.JSON(http.StatusBadRequest, ImageUploadResponse{
			Success: false,
			Error:   "Failed to parse multipart form: " + err.Error(),
		})
		return
	}

	files := c.Request.MultipartForm.File["images"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, ImageUploadResponse{
			Success: false,
			Error:   "No images provided",
		})
		return
	}

	var imageURLs []string
	uploadsDir := "uploads/images"

	// Ensure uploads directory exists
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, ImageUploadResponse{
			Success: false,
			Error:   "Failed to create uploads directory: " + err.Error(),
		})
		return
	}

	for _, fileHeader := range files {
		// Validate file type
		if !isValidImageType(fileHeader.Header.Get("Content-Type")) {
			c.JSON(http.StatusBadRequest, ImageUploadResponse{
				Success: false,
				Error:   "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed",
			})
			return
		}

		// Validate file size (max 10MB)
		if fileHeader.Size > 10<<20 {
			c.JSON(http.StatusBadRequest, ImageUploadResponse{
				Success: false,
				Error:   "File size too large. Maximum size is 10MB",
			})
			return
		}

		// Generate unique filename
		ext := filepath.Ext(fileHeader.Filename)
		filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
		filePath := filepath.Join(uploadsDir, filename)

		// Save file
		if err := saveUploadedFile(fileHeader, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, ImageUploadResponse{
				Success: false,
				Error:   "Failed to save file: " + err.Error(),
			})
			return
		}

		// Create URL for the uploaded image
		imageURL := fmt.Sprintf("/api/v1/images/%s", filename)
		imageURLs = append(imageURLs, imageURL)
	}

	c.JSON(http.StatusOK, ImageUploadResponse{
		Success:   true,
		ImageURLs: imageURLs,
	})
}

// isValidImageType checks if the content type is a valid image type
func isValidImageType(contentType string) bool {
	validTypes := []string{
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
	}

	for _, validType := range validTypes {
		if contentType == validType {
			return true
		}
	}
	return false
}

// saveUploadedFile saves the uploaded file to the specified path
func saveUploadedFile(fileHeader *multipart.FileHeader, dst string) error {
	src, err := fileHeader.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, src)
	return err
}
func processImageFromRequest(imageData string) (string, error) {
	if imageData == "" {
		return "", nil // No image provided
	}

	uploadsDir := "uploads/images"

	// Ensure uploads directory exists
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create uploads directory: %v", err)
	}

	var imageURL string
	var err error

	// Check if it's a base64 data URL (starts with "data:image/")
	if strings.HasPrefix(imageData, "data:image/") {
		imageURL, err = saveBase64Image(imageData, uploadsDir)
		if err != nil {
			return "", fmt.Errorf("failed to save base64 image: %v", err)
		}
	} else if strings.HasPrefix(imageData, "http://") || strings.HasPrefix(imageData, "https://") {
		// It's a URL, download and save the image
		imageURL, err = downloadAndSaveImage(imageData, uploadsDir)
		if err != nil {
			return "", fmt.Errorf("failed to download and save image: %v", err)
		}
	} else {
		// Assume it's already a local path or filename
		imageURL = imageData
	}

	return imageURL, nil
}

// saveBase64Image saves a base64 encoded image to the uploads directory
func saveBase64Image(dataURL, uploadsDir string) (string, error) {
	// Parse the data URL
	// Format: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...
	parts := strings.Split(dataURL, ",")
	if len(parts) != 2 {
		return "", fmt.Errorf("invalid data URL format")
	}

	// Extract MIME type
	header := parts[0]
	mimeType := ""
	if strings.Contains(header, "image/jpeg") || strings.Contains(header, "image/jpg") {
		mimeType = "jpeg"
	} else if strings.Contains(header, "image/png") {
		mimeType = "png"
	} else if strings.Contains(header, "image/gif") {
		mimeType = "gif"
	} else if strings.Contains(header, "image/webp") {
		mimeType = "webp"
	} else {
		return "", fmt.Errorf("unsupported image type")
	}

	// Decode base64 data
	imageData, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return "", fmt.Errorf("failed to decode base64 data: %v", err)
	}

	// Generate unique filename
	filename := fmt.Sprintf("%d.%s", time.Now().UnixNano(), mimeType)
	filePath := filepath.Join(uploadsDir, filename)

	// Save file
	if err := os.WriteFile(filePath, imageData, 0644); err != nil {
		return "", fmt.Errorf("failed to write image file: %v", err)
	}

	// Return URL path
	return fmt.Sprintf("/api/v1/images/%s", filename), nil
}

// downloadAndSaveImage downloads an image from a URL and saves it locally
func downloadAndSaveImage(imageURL, uploadsDir string) (string, error) {
	// Download the image
	resp, err := http.Get(imageURL)
	if err != nil {
		return "", fmt.Errorf("failed to download image: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to download image: status %d", resp.StatusCode)
	}

	// Read image data
	imageData, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read image data: %v", err)
	}

	// Determine file extension from Content-Type
	contentType := resp.Header.Get("Content-Type")
	var ext string
	switch contentType {
	case "image/jpeg", "image/jpg":
		ext = "jpg"
	case "image/png":
		ext = "png"
	case "image/gif":
		ext = "gif"
	case "image/webp":
		ext = "webp"
	default:
		ext = "jpg" // default to jpg
	}

	// Generate unique filename
	filename := fmt.Sprintf("%d.%s", time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadsDir, filename)

	// Save file
	if err := os.WriteFile(filePath, imageData, 0644); err != nil {
		return "", fmt.Errorf("failed to write image file: %v", err)
	}

	// Return URL path
	return fmt.Sprintf("/api/v1/images/%s", filename), nil
}

// RedirectToIPFS redirects to the IPFS URL based on property ID
func RedirectToIPFS(c *gin.Context) {
	propertyID := c.Param("property_id")
	if propertyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Property ID is required",
		})
		return
	}

	// Get property from database
	ctx := context.Background()
	property, err := db.MongoClient.GetPropertyByID(ctx, propertyID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Property not found: " + err.Error(),
		})
		return
	}

	// Redirect to the actual IPFS URL
	ipfsURL := fmt.Sprintf("https://pink-improved-swift-480.mypinata.cloud/ipfs/%s", property.IPFSHash)

	// Redirect to the IPFS URL
	c.Redirect(http.StatusFound, ipfsURL)
}

// GetPropertyInfo returns property information by property ID
func GetPropertyInfo(c *gin.Context) {
	propertyID := c.Param("property_id")
	if propertyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Property ID is required",
		})
		return
	}

	// Get property from database
	ctx := context.Background()
	property, err := db.MongoClient.GetPropertyByID(ctx, propertyID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Property not found: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, property)
}

// CreateMintWithIPFS creates a mint transaction with IPFS metadata upload and optional broadcasting
func CreateMintMessage(c *gin.Context) {
	var req MintRequest
	var processedImageURL string

	// Check content type to determine how to parse the request
	contentType := c.GetHeader("Content-Type")

	if strings.Contains(contentType, "multipart/form-data") {
		// Handle multipart form data
		err := c.Request.ParseMultipartForm(32 << 20) // 32MB max memory
		if err != nil {
			c.JSON(http.StatusBadRequest, MintWithIPFSResponse{
				Error: "Failed to parse multipart form: " + err.Error(),
			})
			return
		}

		// Extract form values
		form := c.Request.MultipartForm

		// Helper function to get form value
		getFormValue := func(key string) string {
			if values, exists := form.Value[key]; exists && len(values) > 0 {
				return values[0]
			}
			return ""
		}

		// Create request struct from form data
		req = MintRequest{
			PropertyName:    getFormValue("property_name"),
			PropertyAddress: getFormValue("property_address"),
			Description:     getFormValue("description"),
			To:              getFormValue("to"),
			ExternalUrl:     getFormValue("external_url"),
		}

		// Validate required fields
		if req.PropertyName == "" {
			c.JSON(http.StatusBadRequest, MintWithIPFSResponse{
				Error: "property_name is required",
			})
			return
		}
		if req.PropertyAddress == "" {
			c.JSON(http.StatusBadRequest, MintWithIPFSResponse{
				Error: "property_address is required",
			})
			return
		}
		if req.Description == "" {
			c.JSON(http.StatusBadRequest, MintWithIPFSResponse{
				Error: "description is required",
			})
			return
		}
		if req.To == "" {
			c.JSON(http.StatusBadRequest, MintWithIPFSResponse{
				Error: "to address is required",
			})
			return
		}

		// Handle image upload if present
		if files, exists := form.File["image"]; exists && len(files) > 0 {
			fileHeader := files[0]

			// Validate file type
			if !isValidImageType(fileHeader.Header.Get("Content-Type")) {
				c.JSON(http.StatusBadRequest, MintWithIPFSResponse{
					Error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed",
				})
				return
			}

			// Validate file size (max 10MB)
			if fileHeader.Size > 10<<20 {
				c.JSON(http.StatusBadRequest, MintWithIPFSResponse{
					Error: "File size too large. Maximum size is 10MB",
				})
				return
			}

			// Generate unique filename
			ext := filepath.Ext(fileHeader.Filename)
			filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
			uploadsDir := "uploads/images"

			// Ensure uploads directory exists
			if err := os.MkdirAll(uploadsDir, 0755); err != nil {
				c.JSON(http.StatusInternalServerError, MintWithIPFSResponse{
					Error: "Failed to create uploads directory: " + err.Error(),
				})
				return
			}

			filePath := filepath.Join(uploadsDir, filename)

			// Save file
			if err := saveUploadedFile(fileHeader, filePath); err != nil {
				c.JSON(http.StatusInternalServerError, MintWithIPFSResponse{
					Error: "Failed to save file: " + err.Error(),
				})
				return
			}

			// Create URL for the uploaded image
			processedImageURL = fmt.Sprintf("https://api.rebnb.sumitdhiman.in/api/v1/images/%s", filename)
		}
	} else {
		// Handle JSON data (original behavior)
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, MintWithIPFSResponse{
				Error: "Invalid request payload: " + err.Error(),
			})
			return
		}
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

	// Process single image from request body (base64, URL, etc.) and save it locally
	// For JSON requests, process the image field; for multipart, processedImageURL is already set
	if processedImageURL == "" && req.Image != "" {
		var processErr error
		processedImageURL, processErr = processImageFromRequest(req.Image)
		if processErr != nil {
			c.JSON(http.StatusInternalServerError, MintWithIPFSResponse{
				Error: "Failed to process image: " + processErr.Error(),
			})
			return
		}
	}

	// Create NFT metadata
	metadata := NFTMetadata{
		Name:        req.PropertyName,
		Description: req.Description,
		ExternalURL: req.ExternalUrl,
		Attributes:  req.Attributes,
	}

	// Set image URL if processed image is available
	if processedImageURL != "" {
		metadata.Image = processedImageURL
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

	// Get Pinata JWT from environment
	pinataJWT := os.Getenv("PINATA_JWT")
	if pinataJWT == "" {
		c.JSON(http.StatusInternalServerError, MintWithIPFSResponse{
			Error: "Pinata JWT not configured",
		})
		return
	}

	// Upload metadata to IPFS via Pinata
	pinataResp, err := uploadToIPFS(metadata, pinataJWT)
	if err != nil {
		c.JSON(http.StatusInternalServerError, MintWithIPFSResponse{
			Error: "Failed to upload to IPFS: " + err.Error(),
		})
		return
	}

	// Create token URI pointing to IPFS
	tokenURI := fmt.Sprintf("https://pink-improved-swift-480.mypinata.cloud/ipfs/%s", pinataResp.IPFSHash)

	// Store property data in database
	property := &db.Property{
		PropertyID:      ppId,
		IPFSHash:        pinataResp.IPFSHash, // Using actual IPFS hash
		WalletAddress:   req.To,
		PropertyName:    req.PropertyName,
		PropertyAddress: req.PropertyAddress,
		Description:     req.Description,
		Image:           processedImageURL,
	}

	ctx := context.Background()
	if err := db.MongoClient.InsertProperty(ctx, property); err != nil {
		// Log the error but don't fail the request
		fmt.Printf("Warning: Failed to store property in database: %v\n", err)
	}

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
	chain, err := GetChain("0g")
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
		IPFSHash:   pinataResp.IPFSHash, // Using actual IPFS hash
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

func GetMetadataForListing(c *gin.Context) {
	// Check if MongoDB client is initialized
	if db.MongoClient.Client == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Database connection not available",
		})
		return
	}

	propertyId := c.Param("property_id")
	if propertyId == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Property ID is required",
		})
		return
	}

	date := c.Param("date")
	if date == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Date is required",
		})
		return
	}

	listing, err := db.MongoClient.GetListingByPropertyAndDate(context.TODO(), propertyId, date)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Listing not found: " + err.Error(),
		})
		return
	}

	http.Redirect(c.Writer, c.Request, "https://pink-improved-swift-480.mypinata.cloud/ipfs/"+listing.IPFSHash, http.StatusFound)
}

func GetProperties(c *gin.Context) {
	// Check if MongoDB client is initialized
	if db.MongoClient.Client == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Database connection not available",
		})
		return
	}

	properties, err := db.MongoClient.GetProperties(context.TODO())
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Properties not found: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, properties)
}
func GetListingsByPropertyHandler(c *gin.Context) {
	// Check if MongoDB client is initialized
	if db.MongoClient.Client == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Database connection not available",
		})
		return
	}

	propertyId := c.Param("property_id")
	if propertyId == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Property ID is required",
		})
		return
	}

	lists, err := db.MongoClient.GetListingsByProperty(context.TODO(), propertyId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Listings not found: " + err.Error(),
		})
		return
	}
	if len(lists) == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Listings not found",
		})
		return
	}

	c.JSON(http.StatusOK, lists)
}
